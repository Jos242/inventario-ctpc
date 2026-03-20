import os

# Correct Gunicorn binary path (it should point to where gunicorn is installed in the container)
command = '/usr/local/bin/gunicorn'  # This should be correct if you are using the default Python container installation

# Python path where the Django application resides in the container
pythonpath = '/app'  # Make sure this path matches the location of your Django app

# Binding Gunicorn to all available network interfaces (0.0.0.0)
bind = '0.0.0.0:8000'

# Number of worker processes (you can adjust based on available CPU)
workers = 3

# Enable capturing of output, including stdout and stderr
capture_output = True

# Set the log level (info is good for production)
loglevel = "info"

# Define the log directory path (this should match the Dockerfile setup)
log_dir = '/var/log/gunicorn'

# Ensure the log directory exists
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Specify log files
errorlog = os.path.join(log_dir, 'error.log')
accesslog = os.path.join(log_dir, 'access.log')
