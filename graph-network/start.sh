#!/bin/bash

python_version_installed="$1"
port="${2:-8000}"

if command -v python &>/dev/null; then
	echo "Make sure nothing is being run @ port : $port"
	if [ "$python_version_installed" == "2" ]; then
		python -m SimpleHTTPServer $port &
	elif [ "$python_version_installed" == "3" ]; then
		python3 -m http.server $port &
	else
		echo "please provide a valid python version (2 or 3)"
		exit 1
	fi
	url="http://localhost:$port/network-graph.html"
	echo "Launching chromium-browser @ $url"
	chromium-browser $url &
else
	echo "Install python first"
fi