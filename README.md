# Famille en Or 🎉

Mini jeu type "Famille en Or" pour anniversaire, compatible GitHub Pages.

## Utilisation

- `index.html` : page principale
- `data.js` : questions et réponses du sondage
- `app.js` : logique du jeu
- `style.css` : design

### Écran animateur
Ouvrir la page normalement.

### Écran public
Ouvrir la même page avec `?mode=display`.

Exemple :
`https://VOTRE-COMPTE.github.io/VOTRE-REPO/?mode=display`

Les deux onglets se synchronisent automatiquement lorsqu'ils sont ouverts dans le même navigateur.

## Ajouter les réponses

Dans `data.js`, pour chaque question :

```js
answers: [
  { text: "Réponse 1", votes: 8 },
  { text: "Réponse 2", votes: 6 },
  { text: "Réponse 3", votes: 5 },
  { text: "Réponse 4", votes: 4 },
  { text: "Réponse 5", votes: 3 },
  { text: "Réponse 6", votes: 2 }
]
```

Le jeu affiche les 6 premières réponses et utilise le nombre de votes comme points.
