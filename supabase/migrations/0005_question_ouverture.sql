-- Question d'ouverture réellement posée pour cette séance (fixe pour la
-- toute première séance d'un narrateur, générée dynamiquement ensuite) --
-- nécessaire pour que l'étape "fragment" et tours_conversation sachent
-- quelle question a été posée sans dépendre d'une constante codée en dur.
alter table sessions add column if not exists question_ouverture text;
