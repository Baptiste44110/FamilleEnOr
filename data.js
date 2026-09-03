// Les réponses du sondage seront à renseigner ici.
// Pour chaque question, ajoute les 6 réponses les plus citées.
// "votes" = nombre de personnes ayant donné cette réponse.

const QUESTIONS = [
  {
    question: "Citez un plat français.",
    answers: [
    { text: "Bœuf bourguignon", votes: 22 },
    { text: "Raclette", votes: 11 },
    { text: "Tartiflette", votes: 8 },
    { text: "Choucroute", votes: 6 },
    { text: "Cassoulet", votes: 6 },
    { text: "Quiche lorraine", votes: 4 },
    { text: "Poulet frites", votes: 4 },
    { text: "Pot-au-feu", votes: 3 },
    { text: "Blanquette de veau", votes: 2 },
    { text: "Bouillabaisse", votes: 2 },
    { text: "Steak frites", votes: 2 },
    { text: "Ratatouille", votes: 2 },
    { text: "Flammekueche", votes: 1 },
    { text: "Rougaille saucisse", votes: 1 },
    { text: "Côte de bœuf", votes: 1 },
    { text: "Croziflette", votes: 1 },
    { text: "Daube", votes: 1 },
    { text: "Bœuf carotte", votes: 1 },
    { text: "Fondue", votes: 1 },
    { text: "Moules-frites", votes: 1 },
    { text: "Galette-saucisse", votes: 1 }
  ]
  },
  {
    question: "Citez un prénom masculin commençant par M.",
    answers: []
  },
  {
    question: "Citez un prénom féminin commençant par A.",
    answers: []
  },
  {
    question: "Citez une excuse pour justifier un retard.",
    answers: []
  },
  {
    question: "Quel objet essentiel emporteriez-vous sur une île déserte ?",
    answers: []
  },
  {
    question: "Quel est le meilleur jour de la semaine ?",
    answers: []
  },
  {
    question: "Quelle est la première chose que vous faites en vous réveillant ?",
    answers: []
  },
  {
    question: "Quel métier rêviez-vous de faire enfant ?",
    answers: []
  },
  {
    question: "Quel est votre parfum de glace préféré ?",
    answers: []
  },
  {
    question: "Citez un gros mot que vous utilisez au volant.",
    answers: []
  }
];

// Exemple de format :
// answers: [
//   { text: "Ratatouille", votes: 8 },
//   { text: "Bœuf bourguignon", votes: 6 },
//   { text: "Crêpes", votes: 5 },
//   { text: "Raclette", votes: 4 },
//   { text: "Quiche", votes: 3 },
//   { text: "Cassoulet", votes: 2 }
// ]
