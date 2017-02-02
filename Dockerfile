FROM grafana/grafana:4.1.1

ADD getdash.js /getdash.js
ADD getdash.app.js /getdash.app.js
ADD getdash.conf.js /getdash.conf.js

ADD install.sh /install.sh
RUN chmod +x /install.sh

RUN ./install.sh /usr/share/grafana
