# Expense Tracker

A simple web application for tracking personal expenses using Firebase for authentication and data storage.

## Features
- User authentication (login/signup) with Firebase.
- Set and update a budget.
- Add, edit, and delete expenses.
- Real-time expense list updates.
- Remaining balance calculation with color-coded alerts.
- Responsive design with a modern UI.

## Technologies
- **Frontend**: React, TypeScript, Tailwind CSS.
- **Backend**: Firebase (Authentication, Firestore).
- **Dependencies**: react-icons.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/expense-tracker.git
   cd expense-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
   - Enable Authentication and Firestore.
   - Add your Firebase configuration to `src/firebase.ts`.

4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage
- Sign up or log in with your email and password.
- Set a budget and add expenses.
- Use the edit (blue pencil) and delete (trash) icons to manage expenses.
- Log out when finished.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss.

## License
[MIT](LICENSE)