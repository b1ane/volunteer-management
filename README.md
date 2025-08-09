To use Volunteer Management Application!


Download Repository zip file


Unzip File


Install MySql LTS and MySql Workbench LTS


After installing MySql for database, launch MySql workbench and launch Volunteer Management DB.session.sql


After database is launched, open CMD, and cd into the repository location (cd downloads \ volunteer-management-main \volunteer-management-main \server ) then type npm start to start the server


After starting the server, open CMD again, and cd into the repository location again, but this time stop at volunteer-management-main instead of \server, once you're cd volunteer-management-main \ volunteer-management-main, type npm start to start the client application


This will take you to http://localhost:3000/


Now you can Use the application as if you're an administrator / volunteer


As an administrator you can access all pages, and only administrators can create events, assign volunteers to events (Manual volunteer matching), and remove volunteers from events


Dependencies

npm install react react-dom react-router-dom
npm install axios
npm install dotenv
npm install express cors mysql2 bcryptjs dotenv crypto nodemailer


npm install axios dayjs
npm install express cors dotenv mysql2 bcrypt
