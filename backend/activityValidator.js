const { body } = require('express-validator');

exports.createActivityValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['Sports', 'Music', 'Arts', 'Food', 'Gaming', 'Study', 'Travel', 'Social', 'Other'])
    .withMessage('Invalid category'),
  
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Activity date must be in the future');
      }
      return true;
    }),
  
  body('time')
    .notEmpty().withMessage('Time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be in HH:MM format'),
  
  body('location.address')
    .trim()
    .notEmpty().withMessage('Location address is required'),
  
  body('location.city')
    .trim()
    .notEmpty().withMessage('City is required'),
  
  body('maxParticipants')
    .optional()
    .isInt({ min: 2, max: 100 }).withMessage('Max participants must be between 2 and 100'),
];

exports.updateActivityValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .optional()
    .isIn(['Sports', 'Music', 'Arts', 'Food', 'Gaming', 'Study', 'Travel', 'Social', 'Other'])
    .withMessage('Invalid category'),
  
  body('date')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Activity date must be in the future');
      }
      return true;
    }),
  
  body('time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be in HH:MM format'),
  
  body('maxParticipants')
    .optional()
    .isInt({ min: 2, max: 100 }).withMessage('Max participants must be between 2 and 100'),
  
  body('status')
    .optional()
    .isIn(['upcoming', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Invalid status')
];
