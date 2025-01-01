# How to Run the Project

# Run Frontend

1. Go to the frontend directory
2. Run `npm install` to install the dependencies
3. Run `npm run dev` to start the server

# Run Backend

1. Go to the backend directory
2. Run `pipenv install` to install the dependencies
3. Run `pipenv shell` to activate the virtual environment
4. Run `python manage.py runserver` to start the server

# Create MYSQL Database

Database name: story
USER: root
PASSWORD: root
PORT': 3360

Make migrations and migrate the database

```bash
python manage.py makemigrations
python manage.py migrate
```
