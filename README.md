# ExamForge Hub

> A public forum and question package repository for the ExamForge Android companion app.

## About

ExamForge Hub is a centralized platform where users can:
- **Browse** academic question packages
- **Search** for specific exam content
- **Upload** new question packages
- **Download** packages compatible with the ExamForge Android app

This is the official question package exchange platform for ExamForge, enabling educators and students to share and discover high-quality exam materials.

## Features

- 🔍 **Advanced Search** - Find question packages by subject, difficulty, and tags
- 📤 **Easy Upload** - Share your question packages with the community
- 📥 **Download Management** - Quick access to downloaded packages
- 🔗 **Firebase Integration** - Secure cloud storage and authentication
- 🚀 **Fast Performance** - Built with React + Vite for optimal speed
- 🎨 **Modern UI** - Beautiful dark-themed interface with Tailwind CSS

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Express.js
- **Database**: Firebase Firestore
- **AI Integration**: Google Generative AI API

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Firebase project configured
- Google Generative AI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/QweQuAB/Exam-Hub.git
cd Exam-Hub
```

2. Install dependencies:
```bash
bun install
# or
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure Firebase:
   - Add your Firebase credentials to `.env.local`
   - Ensure Firestore database is initialized

### Development

Run the development server:
```bash
bun run dev
# or
npm run dev
```

The app will be available at `http://localhost:3000`

### Building for Production

```bash
bun run build
# or
npm run build
```

The production build will be generated in the `dist` folder.

## Deployment

This project is automatically deployed via GitHub Pages when you push to the `main` branch.

Visit the live site: **[ExamForge Hub](https://QweQuAB.github.io/Exam-Hub)**

### Local Preview

```bash
bun run preview
```

## Project Structure

```
├── src/                    # React components and app logic
├── index.html             # Main HTML entry point
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── firebase-*.json        # Firebase configuration files
├── firestore.rules        # Firestore security rules
└── package.json           # Project dependencies
```

## Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build
- `bun run lint` - Run TypeScript type checking
- `bun run clean` - Clean build artifacts

## Configuration

### Environment Variables

Create a `.env.local` file with:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_key
```

### Firestore Security Rules

Security rules are defined in `firestore.rules`. Deploy with:
```bash
firebase deploy --only firestore:rules
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues and feature requests, please open an issue on [GitHub Issues](https://github.com/QweQuAB/Exam-Hub/issues).

---

**Built with ❤️ for educators and students**