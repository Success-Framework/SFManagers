import { z } from 'zod';

// Define the Zod schema for task creation
const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low'], {
    errorMap: () => ({ message: "Priority must be one of: High, Medium, Low" }),
  }),
  dueDate: z.string().optional(), // You can use z.date() if using native date objects
  statusId: z.string().uuid("Invalid status ID"),
  startupId: z.string().uuid("Invalid startup ID"),
  assigneeIds: z.array(z.string().uuid("Invalid assignee ID")),
  isFreelance: z.boolean().optional(),
  estimatedHours: z.number().min(0.01, "Estimated hours must be a positive number").optional(),
  hourlyRate: z.number().min(0, "Hourly rate cannot be negative").optional(),
  basePoints: z.number().min(0, "Base points cannot be negative").optional(),
  totalPoints: z.number().min(0, "Total points cannot be negative").optional(),
  department: z.enum([
    'HR', 
    'Tech and Development', 
    'Operations', 
    'Robotics', 
    'Marketing', 
    'Sales', 
    'Outreach', 
    'Law', 
    'Accounts', 
    'Graphics', 
    'R&D'
  ]).optional(),
  teamName: z.string().min(1, "Team name is required").max(100, "Team name must be less than 100 characters"),
});

// Function to validate task creation
export const validateCreateTask = (data) => {
  try {
    return createTaskSchema.parse(data);
  } catch (error) {
    console.error('Validation error:', error.errors); // Log the validation errors
    throw new Error('Validation failed'); // Optional: Customize error handling
  }
};

export default createTaskSchema;
