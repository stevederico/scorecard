import { useState } from 'react';
import Header from '@stevederico/skateboard-ui/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@stevederico/skateboard-ui/shadcn/ui/card';
import { Button } from '@stevederico/skateboard-ui/shadcn/ui/button';
import { Input } from '@stevederico/skateboard-ui/shadcn/ui/input';
import { Checkbox } from '@stevederico/skateboard-ui/shadcn/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';

/**
 * Todo list view with add, complete, and delete functionality.
 *
 * @component
 * @returns {JSX.Element} Todo list view
 */
export default function HomeView() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Welcome to your todo list', completed: false },
    { id: 2, text: 'Add new tasks below', completed: false },
    { id: 3, text: 'Check off completed items', completed: true },
  ]);
  const [newTodo, setNewTodo] = useState('');

  /**
   * Adds a new todo item to the list.
   */
  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos([...todos, { id: Date.now(), text: newTodo.trim(), completed: false }]);
    setNewTodo('');
  };

  /**
   * Toggles the completed status of a todo.
   * @param {number} id - Todo item ID
   */
  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  /**
   * Removes a todo item from the list.
   * @param {number} id - Todo item ID
   */
  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  /**
   * Handles Enter key press to add todo.
   * @param {KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addTodo();
  };

  const completedCount = todos.filter(t => t.completed).length;

  return (
    <>
      <Header title="Todo List" />
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <Card className="max-w-2xl mx-auto w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>My Tasks</span>
              <span className="text-sm font-normal text-muted-foreground">
                {completedCount}/{todos.length} completed
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a new task..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button onClick={addTodo} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {todos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No tasks yet. Add one above!
                </p>
              ) : (
                todos.map(todo => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id)}
                    />
                    <span className={`flex-1 ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {todo.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTodo(todo.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
