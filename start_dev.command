#!/bin/bash
cd "$(dirname "$0")"
echo "Lancement du serveur local pour Ant-Gularity..."
echo "Le jeu sera disponible sur http://localhost:8000"
open http://localhost:8000
python3 -m http.server 8000
