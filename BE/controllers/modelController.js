
import User         from "../models/User.js";
import Event        from "../models/Event.js";
import Interaction  from '../models/Interaction.js';
import { Parser }   from "json2csv";
import fs           from "fs";
import uploadCSVToHuggingFace from '../services/huggingFaceService.js';
import axios        from "axios";

export const getModelInputStatistic = async () => {

  const dataset = await Interaction.aggregate([

    // JOIN USER
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },

    // JOIN EVENT
    {
      $lookup: {
        from: "events",
        localField: "event_id",
        foreignField: "_id",
        as: "event"
      }
    },
    { $unwind: "$event" },

    // TÍNH FEATURE
    {
      $addFields: {

        age: {
          $cond: [
            { $ifNull: ["$user.birthday", false] },
            {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), "$user.birthday"] },
                  1000 * 60 * 60 * 24 * 365
                ]
              }
            },
            null
          ]
        },

        gender: {
          $switch: {
            branches: [
              { case: { $eq: ["$user.gender", "male"] }, then: 0 },
              { case: { $eq: ["$user.gender", "female"] }, then: 1 },
              { case: { $eq: ["$user.gender", "other"] }, then: 2 }
            ],
            default: null
          }
        },

        genreEncoded: {
          $switch: {
            branches: [
              { case: { $eq: ["$event.genre", "conference"] }, then: 0 },
              { case: { $eq: ["$event.genre", "seminar"] }, then: 1 },
              { case: { $eq: ["$event.genre", "concert"] }, then: 2 },
              { case: { $eq: ["$event.genre", "festival"] }, then: 3 },
              { case: { $eq: ["$event.genre", "sports"] }, then: 4 },
              { case: { $eq: ["$event.genre", "fundraising"] }, then: 5 },
              { case: { $eq: ["$event.genre", "exhibition"] }, then: 6 },
              { case: { $eq: ["$event.genre", "webinar"] }, then: 7 },
              { case: { $eq: ["$event.genre", "productlaunch"] }, then: 8 },
              { case: { $eq: ["$event.genre", "theater"] }, then: 9 }
            ],
            default: 10
          }
        },

        interestScore: {
          $add: [
            "$click",
            { $multiply: ["$purchase", 10] }
          ]
        }

      }
    },

    // GROUP THEO USER + GENRE
    {
      $group: {

        _id: {
          user: "$user_id",
          genre: "$event.genre"
        },

        sameEventGenreClickCount: {
          $sum: "$click"
        },

        sameEventGenrePurchase: {
          $sum: "$purchase"
        },

        rows: { $push: "$$ROOT" }
      }
    },

    { $unwind: "$rows" },

    // FINAL DATASET
    {
      $project: {

        user_id: "$rows.user_id",
        event_id: "$rows.event_id",

        age: "$rows.age",
        gender: "$rows.gender",

        avgPurchasePrice: "$rows.user.avgPurchasePrice",
        totalSpent: "$rows.user.totalSpent",
        totalTicketsPurchase: "$rows.user.totalTicketsPurchase",

        genre: "$rows.genreEncoded",
        ageLimit: "$rows.event.ageLimit",

        eventClickCount: "$rows.event.clickCount",
        totalTickets: "$rows.event.totalTickets",

        sameEventGenreClickCount: 1,
        sameEventGenrePurchase: 1,

        interestScore: "$rows.interestScore"
      }
    }

  ])

  return dataset
}

export const exportTrainingCSV = async (req, res) => {
  try {

    // 1. Generate dataset
    const dataset = await getModelInputStatistic();

    const fields = [
      "user_id",
      "event_id",
      "age",
      "gender",
      "avgPurchasePrice",
      "totalSpent",
      "totalTicketsPurchase",
      "genre",
      "ageLimit",
      "eventClickCount",
      "totalTickets",
      "sameEventGenreClickCount",
      "sameEventGenrePurchase",
      "interestScore"
    ];

    const parser = new Parser({ fields });

    const csv = parser.parse(dataset);

    // 2. Tạo file tạm
    const filePath = "training_dataset.csv";
    fs.writeFileSync(filePath, csv);

    // 3. Upload lên HuggingFace
    await uploadCSVToHuggingFace(csv);

    // 4. Xoá file sau khi upload
    fs.unlinkSync(filePath);

    return res.status(200).json({
      message: "Dataset exported and uploaded to HuggingFace successfully"
    });

  } catch (err) {

    console.error("Export CSV pipeline error:", err);

    // nếu lỗi mà file tồn tại thì xoá
    if (fs.existsSync("training_dataset.csv")) {
      fs.unlinkSync("training_dataset.csv");
    }

    return res.status(500).json({
      message: "Export CSV pipeline failed"
    });
  }
};

export const wakeupGithubAction = async (req, res) => {

  try {

    const owner     = process.env.GITHUB_OWNER;
    const repo      = process.env.GITHUB_REPO;
    const workflow  = "train.yml";
    const branch    = "main";

    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return res.status(500).json({
        message: "Missing GITHUB_TOKEN environment variable"
      });
    }

    await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`,
      {
        ref: branch
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json"
        }
      }
    );

    return res.status(200).json({
      message: "Training workflow triggered successfully"
    });

  } catch (err) {

    console.error("GitHub Action trigger error:", err.response?.data || err.message);

    return res.status(500).json({
      message: "Failed to trigger training workflow"
    });
  }

};

function encodeGender(gender) {
  if (gender === "male") return 0
  if (gender === "female") return 1
  if (gender === "other") return 2
  return null
}

function encodeGenre(genre) {
  const map = {
    conference: 0,
    seminar: 1,
    concert: 2,
    festival: 3,
    sports: 4,
    fundraising: 5,
    exhibition: 6,
    webinar: 7,
    productlaunch: 8,
    theater: 9
  }

  return map[genre] ?? 10
}

export const getRecommendedList = async (req, res) => {
  try {

    const userId = req.user.id

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const age = user.birthday
      ? Math.floor((Date.now() - new Date(user.birthday)) / (1000 * 60 * 60 * 24 * 365))
      : null

    const gender = encodeGender(user.gender)

    const userFeatures = [
      age,
      gender,
      user.avgPurchasePrice || 0,
      user.totalSpent || 0,
      user.totalTicketsPurchase || 0
    ]

    // genre stats
    const genreStats = await Interaction.aggregate([
      { $match: { user_id: user._id } },

      {
        $lookup: {
          from: "events",
          localField: "event_id",
          foreignField: "_id",
          as: "event"
        }
      },

      { $unwind: "$event" },

      {
        $group: {
          _id: "$event.genre",
          sameEventGenreClickCount: { $sum: "$click" },
          sameEventGenrePurchase: { $sum: "$purchase" }
        }
      }
    ])

    const genreMap = {}

    for (const row of genreStats) {
      genreMap[row._id] = {
        click: row.sameEventGenreClickCount,
        purchase: row.sameEventGenrePurchase
      }
    }

    // lấy 20 event mới nhất
    const events = await Event.find()
      .sort({ createdAt: -1 })
      .limit(20)

    const eventsPayload = {}

    for (const event of events) {

      const stats = genreMap[event.genre] || {
        click: 0,
        purchase: 0
      }

      eventsPayload[event._id.toString()] = [
        encodeGenre(event.genre),
        event.ageLimit || 0,
        event.clickCount || 0,
        event.totalTickets || 0,
        stats.click,
        stats.purchase
      ]
    }

    const callModel = async () => {
      const url = process.env.HF_SPACE_PREDICT_API

      for (let i = 0; i < 3; i++) {

        try {

          const response = await axios.post(
            url,
            {
              user_features: userFeatures,
              events: eventsPayload
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.HF_TOKEN}`
              },
              timeout: 10000
            }
          )

          return response.data

        } catch (err) {

          if (i === 2) throw err

          console.log("Model sleeping... retrying")

          await new Promise(r => setTimeout(r, 3000))
        }
      }
    }

    const data = await callModel()

    const scores = data.scores || {}

    const result = events.map(event => ({
        _id: event._id,
        title: event.title,
        score: scores[event._id.toString()] || 0
    }))

    result.sort((a, b) => b.score - a.score)

    return res.json(result)

  } catch (err) {

    console.error("Recommendation error:", err.message)

    return res.status(500).json({
      message: "Recommendation failed"
    })
  }
}