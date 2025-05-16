const { db } = require('../database');

// Calculate urgency level based on estimated hours and due date
const calculateUrgencyLevel = (estimatedHours, dueDate) => {
  if (!dueDate) return 'MEDIUM'; // Default to medium if no due date
  
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // If already overdue
  if (diffDays < 0) return 'CRITICAL';
  
  // Calculate urgency score: higher means more urgent
  // Formula: estimatedHours / daysLeft × 100
  const urgencyScore = (estimatedHours / Math.max(diffDays, 1)) * 100;
  
  if (urgencyScore > 80) return 'CRITICAL';
  if (urgencyScore > 50) return 'HIGH';
  if (urgencyScore > 30) return 'MEDIUM';
  return 'LOW';
};

// Update urgency levels for all freelance tasks
const updateAllTaskUrgencyLevels = async () => {
  console.log('Starting urgency level update for all tasks...');
  
  try {
    // Get all freelance tasks with due dates
    const tasksQuery = `
      SELECT id, estimatedHours, dueDate, urgencyLevel 
      FROM Task 
      WHERE isFreelance = 1 AND dueDate IS NOT NULL
    `;
    
    const tasks = await db.raw(tasksQuery);
    console.log(`Found ${tasks.length} freelance tasks with due dates to update`);
    
    let updatedCount = 0;
    
    // Process each task
    for (const task of tasks) {
      const newUrgencyLevel = calculateUrgencyLevel(task.estimatedHours || 1, task.dueDate);
      
      // Only update if urgency level has changed
      if (newUrgencyLevel !== task.urgencyLevel) {
        console.log(`Updating task ${task.id} urgency from ${task.urgencyLevel} to ${newUrgencyLevel}`);
        
        // Calculate new points multiplier based on urgency
        let pointsMultiplier = 1.0;
        switch (newUrgencyLevel) {
          case 'CRITICAL': pointsMultiplier = 2.0; break;
          case 'HIGH': pointsMultiplier = 1.5; break;
          case 'MEDIUM': pointsMultiplier = 1.2; break;
          default: pointsMultiplier = 1.0;
        }
        
        // Get current basePoints
        const currentTask = await db.findOne('Task', { id: task.id });
        const basePoints = currentTask.basePoints || 0;
        const totalPoints = Math.round(basePoints * pointsMultiplier);
        
        // Update task with new urgency level and points
        await db.update('Task', { id: task.id }, {
          urgencyLevel: newUrgencyLevel,
          pointsMultiplier,
          totalPoints,
          updatedAt: new Date()
        });
        
        updatedCount++;
      }
    }
    
    console.log(`Urgency level update complete. Updated ${updatedCount} tasks.`);
    return { success: true, updatedCount };
  } catch (error) {
    console.error('Error updating task urgency levels:', error);
    return { success: false, error: error.message };
  }
};

// This function can be called directly or scheduled via cron
const runUrgencyUpdate = async () => {
  console.log('Running scheduled urgency update...');
  const result = await updateAllTaskUrgencyLevels();
  
  if (result.success) {
    console.log(`Urgency update succeeded. Updated ${result.updatedCount} tasks.`);
  } else {
    console.error('Urgency update failed:', result.error);
  }
};

module.exports = {
  calculateUrgencyLevel,
  updateAllTaskUrgencyLevels,
  runUrgencyUpdate
}; 