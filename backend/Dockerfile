# Use official Python image from Docker Hub
FROM python:3.12

RUN apt-get update && apt-get install -y dos2unix perl

# Set working directory in the container
WORKDIR /app

# Copy the backend code into the container
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port the app runs on
EXPOSE 9900

# Set the environment variable for Flask
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Start the Flask application
CMD ["flask", "run"]