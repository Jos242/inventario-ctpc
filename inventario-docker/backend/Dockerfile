# Start from an official Python image
FROM python:3.12

#Install LibreOffice
RUN apt-get update && apt-get install -y libreoffice && apt-get clean

# Set the working directory inside the container
WORKDIR /app


# Copy requirements then install
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt && \
    pip install --no-cache-dir gunicorn

# Create log dir
RUN mkdir -p /var/log/gunicorn

# Copy project files
COPY . /app

EXPOSE 8000

# Run gunicorn (config file provided separately)
CMD ["gunicorn", "sgica.wsgi:application", "-c", "/app/gunicorn.conf.py"]
