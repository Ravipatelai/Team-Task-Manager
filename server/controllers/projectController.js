const Project = require('../models/Project');
const Task = require('../models/Task');

const createProject = async (req, res, next) => {
  try {
    const { name, members } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('Please provide a project name');
    }

    const projectMembers = members ? [...members] : [];
    if (!projectMembers.includes(req.user._id.toString())) {
      projectMembers.push(req.user._id);
    }

    const project = await Project.create({
      name,
      createdBy: req.user._id,
      members: projectMembers,
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

const getProjects = async (req, res, next) => {
  try {
    let projects;
    
    // Admins can see projects they created or are a part of, maybe all?
    // Let's say Admins see all projects they created or are in. 
    // Wait, simple rule: If Admin, see all. If member, see where they are in members.
    if (req.user.role === 'Admin') {
      projects = await Project.find({}).populate('members', 'name email');
    } else {
      projects = await Project.find({ members: req.user._id }).populate('members', 'name email');
    }

    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('members', 'name email');
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }
    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    if (req.user.role !== 'Admin') {
      res.status(403);
      throw new Error('Not authorized to update project');
    }

    project.name = req.body.name || project.name;
    
    if (req.body.members) {
      const projectMembers = [...req.body.members];
      if (!projectMembers.includes(req.user._id.toString())) {
        projectMembers.push(req.user._id);
      }
      project.members = projectMembers;
    }

    const updatedProject = await project.save();
    res.status(200).json(updatedProject);
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    if (req.user.role !== 'Admin') {
      res.status(403);
      throw new Error('Not authorized to delete project');
    }

    // Cascade delete tasks related to this project
    await Task.deleteMany({ projectId: project._id });
    await project.deleteOne();

    res.status(200).json({ message: 'Project removed along with its tasks' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createProject, getProjects, getProjectById, updateProject, deleteProject };
