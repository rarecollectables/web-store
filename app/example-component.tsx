import React from 'react';

type ExampleProps = {
  message: string;
  count?: number;
};

export const ExampleComponent: React.FC<ExampleProps> = ({ message, count = 0 }) => {
  return (
    <div>
      <h2>TypeScript Example</h2>
      <p>{message}</p>
      <p>Count: {count}</p>
    </div>
  );
};
