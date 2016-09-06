FROM python:2-alpine
RUN pip install flask requests
WORKDIR /usr/local/var/app
CMD ["python","runweb.py"]