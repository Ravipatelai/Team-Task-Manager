import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import { Plus, ArrowLeft, Pencil, Trash2 } from 'lucide-react';

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', assignedTo: '', deadline: ''
  });
  
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  
  const [error, setError] = useState('');

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?projectId=${id}`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
      
      if (user.role === 'Admin') {
        const usersRes = await api.get('/auth/users');
        setUsers(usersRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const openCreateTaskModal = () => {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', assignedTo: '', deadline: '' });
    setShowTaskModal(true);
  };

  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo?._id || '',
      deadline: task.deadline ? task.deadline.split('T')[0] : ''
    });
    setShowTaskModal(true);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    try {
      setError('');
      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, taskForm);
      } else {
        await api.post('/tasks', { ...taskForm, projectId: id });
      }
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm({ title: '', description: '', assignedTo: '', deadline: '' });
      fetchProjectDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.put(`/projects/${id}`, { name: editProjectName });
      setShowEditProjectModal(false);
      fetchProjectDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this project? All tasks will be deleted.')) {
      try {
        await api.delete(`/projects/${id}`);
        navigate('/projects');
      } catch (err) {
        console.error('Failed to delete project', err);
      }
    }
  };

  if (loading) return <div className="flex justify-center mt-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (!project) return <div className="text-center mt-10">Project not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/projects" className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Projects
      </Link>

      <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-slate-800">{project.name}</h1>
            {user.role === 'Admin' && (
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => { setEditProjectName(project.name); setShowEditProjectModal(true); }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-blue-50 rounded"
                  title="Edit Project"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleDeleteProject}
                  className="p-1.5 text-slate-400 hover:text-red-600 transition-colors bg-slate-100 hover:bg-red-50 rounded"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <p className="text-slate-500 mt-2 text-sm">Created on {new Date(project.createdAt).toLocaleDateString()}</p>
        </div>
        {user.role === 'Admin' && (
          <button 
            onClick={openCreateTaskModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Task
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center text-slate-500">
          No tasks found for this project.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map(task => (
            <TaskCard key={task._id} task={task} onTaskUpdate={fetchProjectDetails} onEdit={openEditTaskModal} />
          ))}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editingTask ? 'Edit Task' : 'Add New Task'}</h2>
            <form onSubmit={handleSubmitTask} className="space-y-4">
              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text" required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-md" rows="3"
                  value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                <select
                  required className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  value={taskForm.assignedTo} onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}
                >
                  <option value="">Select a user...</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
                <input
                  type="date" required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})}
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">{editingTask ? 'Save Changes' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Project Modal */}
      {showEditProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Edit Project</h2>
            <form onSubmit={handleUpdateProject}>
              {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                <input
                  type="text" required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowEditProjectModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
