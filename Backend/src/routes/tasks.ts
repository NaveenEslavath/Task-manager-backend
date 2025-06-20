import { Router, Request, Response } from "express";
import { AppDataSource } from "../index";
import { Task, TaskStatus } from "../entity/Task";

const router = Router();

// GET /tasks - Get all tasks
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const taskRepository = AppDataSource.getRepository(Task);
    const tasks = await taskRepository.find({
      order: { createdAt: "DESC" }
    });
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// POST /tasks - Create a new task
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, status, dueDate } = req.body;

    // Validation
    if (!title || !title.trim()) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    if (status && !Object.values(TaskStatus).includes(status)) {
      res.status(400).json({ error: "Invalid status value" });
      return;
    }

    const taskRepository = AppDataSource.getRepository(Task);
    const task = taskRepository.create({
      title: title.trim(),
      description: description?.trim() || null,
      status: status || TaskStatus.TODO,
      dueDate: dueDate ? new Date(dueDate) : null
    });

    const savedTask = await taskRepository.save(task);
    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// PUT /tasks/:id - Update a task
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, status, dueDate } = req.body;

    const taskRepository = AppDataSource.getRepository(Task);
    const task = await taskRepository.findOneBy({ id });

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    // Validation
    if (title !== undefined && (!title || !title.trim())) {
      res.status(400).json({ error: "Title cannot be empty" });
      return;
    }

    if (status && !Object.values(TaskStatus).includes(status)) {
      res.status(400).json({ error: "Invalid status value" });
      return;
    }

    // Update fields
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description?.trim() || null;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    const updatedTask = await taskRepository.save(task);
    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// DELETE /tasks/:id - Delete a task
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const taskRepository = AppDataSource.getRepository(Task);
    
    const result = await taskRepository.delete({ id });
    
    if (result.affected === 0) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;