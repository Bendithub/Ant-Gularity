@echo off
echo Lancement du serveur local pour Ant-Gularity...
echo Le jeu s'ouvrira sur http://localhost:8000
start http://localhost:8000
python -m http.server 8000
