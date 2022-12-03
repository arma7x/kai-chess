#!/bin/sh

rm -R ./.v2
mkdir ./.v2 && cp -R * ./.v2
cd ./.v2
rm "./manifest.webmanifest"
rm "./build.sh"
zip -r "./application.zip" *
cp ./application.zip ../
cd ../
rm -R ./.v2
