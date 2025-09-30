# Bloodline - DNA Testing Service

A comprehensive DNA testing service platform that allows users to book appointments, manage their DNA test results, and connect with healthcare professionals.

## Features

- User authentication and authorization
- DNA test booking and management
- Result tracking and analysis
- Professional consultation booking
- Admin dashboard for service management

## Tech Stack

### Frontend
- React.js
- React Router
- Context API for state management
- Bootstrap for styling

### Backend
- Spring Boot
- Spring Security
- JWT Authentication
- MySQL Database

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Java JDK 11 or higher
- MySQL 8.0 or higher

### Installation

1. Clone the repository
```bash
git clone https://github.com/igotdepression/SWP391.git
```

2. Install frontend dependencies
```bash
cd frontend/bloodline-frontend
npm install
```

3. Install backend dependencies
```bash
cd backend/bloodline-backend
mvn install
```

4. Configure the database
- Create a MySQL database
- Update the database configuration in `backend/bloodline-backend/src/main/resources/application.properties`

5. Run the application
- Frontend:
```bash
cd frontend/bloodline-frontend
npm start
```
- Backend:
```bash
cd backend/bloodline-backend
mvn spring-boot:run
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
