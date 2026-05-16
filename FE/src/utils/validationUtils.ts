/**
 * Validation utilities for form fields
 */

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Vietnamese phone number
 * Accepts: 10-11 digits starting with 0, or +84
 */
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return true; // phone is optional
  const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate name (firstName, lastName)
 * Only allows letters, Vietnamese characters, spaces, hyphens
 * No numbers or special characters
 */
export const validateName = (name: string): boolean => {
  if (!name) return false;
  // Allow letters (including Vietnamese), spaces, and hyphens
  const nameRegex = /^[a-zA-ZÀ-ỿ\s\-']+$/;
  return nameRegex.test(name.trim());
};

/**
 * Validate if person is at least 16 years old
 */
export const validateAge = (birthDate: any): boolean => {
  if (!birthDate) return false;
  
  const today = new Date();
  const birth = new Date(birthDate);
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age >= 16;
};

/**
 * Get error message for validation
 */
export const getValidationErrorMessage = (field: string): string => {
  const messages: { [key: string]: string } = {
    email: 'Email không hợp lệ',
    phone: 'Số điện thoại không hợp lệ (cần từ 10-11 chữ số)',
    firstName: 'Tên không được chứa số hoặc ký tự đặc biệt',
    lastName: 'Họ không được chứa số hoặc ký tự đặc biệt',
    birthDate: 'Bạn phải đủ 16 tuổi để đăng ký',
  };
  return messages[field] || 'Dữ liệu không hợp lệ';
};
