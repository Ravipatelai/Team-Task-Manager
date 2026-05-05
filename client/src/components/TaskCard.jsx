import React, { useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Calendar, User, Pencil, Trash2 } from 'lucide-react';

const TaskCard = ({ task, onTaskUpdate, onEdit }) => {
  const { user } = useContext(AuthContext);
  const isAssigned = user._id === task.assignedTo?._id;
  const canEdit = user.role === 'Admin' || isAssigned;

  const handleStatusChange = async (e) => {
    try {
      await api.put(`/tasks/${task._id}`, { status: e.target.value });
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${task._id}`);
        if (onTaskUpdate) onTaskUpdate();
      } catch (error) {
        console.error('Failed to delete task', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const isOverdue = task.status !== 'Done' && new Date(task.deadline) < new Date();

  return (
    <div className={`p-4 bg-white border rounded-lg shadow-sm transition-all hover:shadow-md ${isOverdue ? 'border-red-300' : 'border-slate-200'}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-slate-800">{task.title}</h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}>
          {task.status}
        </span>
      </div>
      
      <p className="text-slate-600 text-sm mb-4 line-clamp-2">{task.description}</p>
      
      <div className="flex flex-col space-y-2 mb-4">
        <div className="flex items-center text-xs text-slate-500">
          <User className="w-3 h-3 mr-1" />
          <span>{task.assignedTo?.name || 'Unassigned'}</span>
        </div>
        <div className={`flex items-center text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
          <Calendar className="w-3 h-3 mr-1" />
          <span>{new Date(task.deadline).toLocaleDateString()}</span>
        </div>
      </div>

      {canEdit && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <label className="text-xs text-slate-500 block mb-1">Update Status</label>
          <select 
            value={task.status} 
            onChange={handleStatusChange}
            className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mb-4"
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>

          {user.role === 'Admin' && (
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => onEdit && onEdit(task)}
                className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                title="Edit Task"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button 
                onClick={handleDelete}
                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
