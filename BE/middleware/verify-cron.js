export const verifyCronService = (req, res, next) => {
    const secret = req.headers['x-cron-secret'] || req.headers['X-Cron-Secret']

    if (secret !== process.env.CRON_SECRET) {
        return res.status(401).json({ error: 'Unauthorized cron' })
    }
    next();
};