export interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  completed?: boolean;
}

export type UpdateTodoInput = Partial<CreateTodoInput>;
