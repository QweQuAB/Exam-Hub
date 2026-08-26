# Development Guide

## Getting Started

### Prerequisites

- Node.js 18+ or Bun 1.0+
- Git
- A code editor (VS Code recommended)

### Initial Setup

1. Clone the repository:
```bash
git clone https://github.com/QweQuAB/Exam-Hub.git
cd Exam-Hub
```

2. Install dependencies:
```bash
npm install
# or with bun
bun install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Configure Firebase credentials in `.env.local`

### Running Development Server

```bash
npm run dev
```

The app will start at `http://localhost:3000` with hot module replacement (HMR) enabled.

## Project Structure

```
Exam-Hub/
├── src/
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # Main app component
│   ├── components/       # React components
│   ├── pages/            # Page components
│   ├── services/         # API and Firebase services
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   └── styles/           # Global styles
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── package.json          # Dependencies
└── README.md             # Project documentation
```

## Development Workflow

### Making Changes

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes

3. Test locally:
```bash
npm run lint        # Check TypeScript types
npm run build      # Ensure production build works
npm run preview    # Test the production build
```

4. Commit and push:
```bash
git add .
git commit -m "feat: describe your changes"
git push origin feature/your-feature-name
```

5. Create a Pull Request on GitHub

### Coding Standards

- **TypeScript**: All code should be properly typed
- **ESLint**: Run `npm run lint` to check for issues
- **React**: Use functional components and hooks
- **Naming**: Use camelCase for variables/functions, PascalCase for components
- **Comments**: Add comments for complex logic

## Building for Production

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

The output will be in the `dist/` folder.

## TypeScript

This project uses TypeScript for type safety. Check types with:

```bash
npm run lint
```

### Common Types

Define custom types in `src/types/` directory:

```typescript
// src/types/exam.ts
export interface ExamPackage {
  id: string;
  title: string;
  subject: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}
```

## Styling with Tailwind CSS

The project uses Tailwind CSS for styling. Key features:

- Dark mode enabled by default (class="dark")
- Custom configuration in `tailwind.config.js`
- Use Tailwind utilities instead of writing CSS when possible

### Example:

```tsx
export function Card({ title, children }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 shadow-lg">
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <div className="text-slate-300">{children}</div>
    </div>
  );
}
```

## Firebase Integration

### Configuration

Firebase configuration is loaded from environment variables:

```typescript
// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ... other config
});

export const db = getFirestore(firebaseApp);
```

### Using Firestore

```typescript
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Add a document
const docRef = await addDoc(collection(db, 'packages'), {
  title: 'Math Exam',
  subject: 'Mathematics',
});

// Query documents
const q = query(collection(db, 'packages'), where('subject', '==', 'Mathematics'));
const snapshot = await getDocs(q);
```

## Debugging

### Browser DevTools

- Open DevTools: `F12` or `Cmd+Option+I`
- Use React DevTools browser extension for component inspection
- Check Console tab for errors and logs

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

## Performance

### Optimization Tips

1. **Code Splitting**: Use React.lazy for route-based splitting
2. **Image Optimization**: Compress images before adding to repo
3. **Bundle Analysis**: Use Vite's analyze plugin
4. **Lighthouse**: Run Chrome DevTools Lighthouse to check performance

### Monitoring

- Check Network tab in DevTools to monitor load times
- Use React Profiler to identify slow components

## Common Tasks

### Add a New Component

1. Create component file: `src/components/MyComponent.tsx`
2. Export from component barrel: `src/components/index.ts`
3. Use in your app

### Add a New Page

1. Create page file: `src/pages/MyPage.tsx`
2. Import in Router configuration
3. Add route to navigation

### Add a New Dependency

```bash
# Using npm
npm install package-name

# Using bun
bun add package-name

# Development dependency
npm install --save-dev package-name
```

## Testing

While no test framework is currently configured, you can add one:

```bash
# Add Vitest
npm install --save-dev vitest

# Add React Testing Library
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

## Troubleshooting

### Port 3000 already in use

```bash
# Use a different port
npm run dev -- --port 3001
```

### Module not found errors

- Ensure TypeScript configuration has correct path aliases
- Check that imports use correct relative/absolute paths
- Verify files exist and extensions are correct

### Environment variables not loading

- Restart dev server after changing `.env.local`
- Ensure variables are prefixed with `VITE_`
- Check console for variable values: `console.log(import.meta.env)`

### Firebase connection issues

- Verify Firebase credentials in `.env.local`
- Check Firebase console for project status
- Ensure Firestore database is initialized
- Check firestore.rules for access permissions

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Google Generative AI](https://ai.google.dev/docs)

---

Happy coding! 🚀