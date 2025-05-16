import React, { useState, useEffect } from 'react';
import moment from 'moment';

interface User {
  id: string;
  name: string;
  email: string;
}

interface TaskStatus {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  assignees: User[];
  creator: User;
  priority: 'low' | 'medium' | 'high';
  isFreelance: boolean;
  estimatedHours?: number;
  hourlyRate?: number;
  urgencyLevel?: string;
  startTime?: string;
  endTime?: string;
  totalTimeSpent?: number;
}

interface TimeLog {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  note: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface TimeTrackingModalProps {
  task: Task;
  onClose: () => void;
  onTimeUpdate: (taskId: string, timeSpent: number) => void;
}

const TimeTrackingModal: React.FC<TimeTrackingModalProps> = ({ task, onClose, onTimeUpdate }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalTime, setTotalTime] = useState(task.totalTimeSpent || 0);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(diff);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  useEffect(() => {
    const checkTimerState = async () => {
      try {
        const response = await fetch(`/api/tasks/${task.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const taskData = await response.json();
          if (taskData.isTimerRunning && taskData.timerStartedAt) {
            setIsRunning(true);
            setStartTime(new Date(taskData.timerStartedAt));
          }
        }
      } catch (error) {
        console.error('Error checking timer state:', error);
      }
    };

    checkTimerState();
  }, [task.id]);

  useEffect(() => {
    const fetchTimeLogs = async () => {
      try {
        const response = await fetch(`/api/tasks/${task.id}/time-logs`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const logs = await response.json();
          setTimeLogs(logs);
        }
      } catch (error) {
        console.error('Error fetching time logs:', error);
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchTimeLogs();
  }, [task.id]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    const now = new Date();
    setIsRunning(true);
    setStartTime(now);

    try {
      const response = await fetch(`/api/tasks/${task.id}/timer/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'Timer is already running for this task') {
          await fetch(`/api/tasks/${task.id}/timer/stop`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const retryResponse = await fetch(`/api/tasks/${task.id}/timer/start`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (!retryResponse.ok) {
            throw new Error('Failed to start time tracking after reset');
          }
        } else {
          throw new Error(errorData.error || 'Failed to start time tracking');
        }
      }

      const data = await response.json();
      console.log('Timer started successfully:', data);
    } catch (error) {
      console.error('Error starting time tracking:', error);
      setIsRunning(false);
      setStartTime(null);
      // You might want to show an error message to the user here
    }
  };

  const handlePause = async () => {
    if (!startTime) return;

    const now = new Date();
    const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    setIsRunning(false);
    setTotalTime((prev: number) => prev + duration);
    setElapsedTime(0);

    try {
      const response = await fetch('/api/tasks/time/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          taskId: task.id,
          endTime: now.toISOString(),
          duration: duration
        })
      });

      if (!response.ok) {
        throw new Error('Failed to pause time tracking');
      }
    } catch (error) {
      console.error('Error pausing time tracking:', error);
    }
  };

  const handleStop = async () => {
    if (!startTime) return;

    const now = new Date();
    const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const finalTime = totalTime + duration;

    setIsRunning(false);
    setElapsedTime(0);
    setTotalTime(0);
    setStartTime(null);

    try {
      const response = await fetch(`/api/tasks/${task.id}/timer/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          timeSpent: finalTime,
          note: 'Timer stopped manually'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to stop time tracking');
      }

      const data = await response.json();
      console.log('Timer stopped successfully:', data);
      onTimeUpdate(task.id, finalTime);
      onClose();
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Time Tracking - {task.title}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="task-details mb-4">
              <div className="mb-2">
                <strong>Description:</strong>
                <p className="mb-0">{task.description}</p>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <strong>Start Date:</strong>
                  <p>{moment(task.startTime).format('MMM D, YYYY')}</p>
                </div>
                <div className="col-md-6">
                  <strong>Due Date:</strong>
                  <p>{moment(task.dueDate).format('MMM D, YYYY')}</p>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <strong>Assignee:</strong>
                  <p>{task.assignees.map((a: User) => a.name).join(', ')}</p>
                </div>
                <div className="col-md-6">
                  <strong>Status:</strong>
                  <p>{task.status.name}</p>
                </div>
              </div>
            </div>

            <div className="time-tracking mb-4">
              <div className="current-time text-center mb-3">
                <h2 className="display-4">{formatTime(totalTime + elapsedTime)}</h2>
              </div>
              <div className="d-flex justify-content-center gap-2">
                {!isRunning ? (
                  <button 
                    className="btn btn-success"
                    onClick={handleStart}
                  >
                    <i className="bi bi-play-fill me-2"></i>Start
                  </button>
                ) : (
                  <button 
                    className="btn btn-warning"
                    onClick={handlePause}
                  >
                    <i className="bi bi-pause-fill me-2"></i>Pause
                  </button>
                )}
                <button 
                  className="btn btn-danger"
                  onClick={handleStop}
                  disabled={!isRunning && totalTime === 0}
                >
                  <i className="bi bi-stop-fill me-2"></i>Stop
                </button>
              </div>
            </div>

            <div className="time-logs mt-4">
              <h6 className="mb-3">Time Logs</h6>
              {isLoadingLogs ? (
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : timeLogs.length === 0 ? (
                <p className="text-muted">No time logs available</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Duration</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{log.user.name}</td>
                          <td>{new Date(log.startTime).toLocaleString()}</td>
                          <td>{new Date(log.endTime).toLocaleString()}</td>
                          <td>{formatTime(log.duration)}</td>
                          <td>{log.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
            z-index: 1040;
          }

          .modal-dialog {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1050;
            width: 100%;
            max-width: 500px;
            margin: 1.75rem auto;
          }

          .modal-content {
            position: relative;
            display: flex;
            flex-direction: column;
            width: 100%;
            background-color: #fff;
            background-clip: padding-box;
            border: 1px solid rgba(0, 0, 0, 0.2);
            border-radius: 0.3rem;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
          }

          .modal-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            padding: 1rem;
            border-bottom: 1px solid #dee2e6;
            border-top-left-radius: 0.3rem;
            border-top-right-radius: 0.3rem;
          }

          .modal-body {
            position: relative;
            flex: 1 1 auto;
            padding: 1rem;
          }

          .task-details {
            background-color: #f8f9fa;
            padding: 1rem;
            border-radius: 0.25rem;
          }

          .time-tracking {
            background-color: #fff;
            padding: 1.5rem;
            border-radius: 0.25rem;
            box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
          }

          .current-time {
            font-family: monospace;
            color: #212529;
          }

          .btn {
            padding: 0.5rem 1rem;
            font-size: 1rem;
            border-radius: 0.25rem;
            transition: all 0.2s ease-in-out;
          }

          .btn:disabled {
            opacity: 0.65;
            cursor: not-allowed;
          }

          .btn-success {
            background-color: #198754;
            border-color: #198754;
            color: white;
          }

          .btn-warning {
            background-color: #ffc107;
            border-color: #ffc107;
            color: #212529;
          }

          .btn-danger {
            background-color: #dc3545;
            border-color: #dc3545;
            color: white;
          }

          .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
          }

          .time-logs {
            background-color: #f8f9fa;
            padding: 1rem;
            border-radius: 0.25rem;
          }

          .table {
            margin-bottom: 0;
          }

          .table th {
            font-weight: 600;
            background-color: #e9ecef;
          }

          .table td {
            vertical-align: middle;
          }
        `}
      </style>
    </>
  );
};

export default TimeTrackingModal; 