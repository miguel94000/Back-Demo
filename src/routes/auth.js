require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const UserProfil = mongoose.model("UserProfil");
const nodemailer = require("nodemailer");
const router = express.Router();
const jwt = require("jsonwebtoken"); // Librairie utilisée pour la gestion de token

// Pour l'authentification
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(422)
      .send({ error: "Veuillez renseigner un e-mail et un mot de passe" });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(422).send({ error: "Email ou mot de passe invalide" });
  }

  try {
    await user.comparePassword(password);

    // Création du token
    const token = jwt.sign({ userId: user._id }, "MY_SECRET_KEY");

    // Recupération du userProfil
    const userProfil = await UserProfil.findOne({ userId: user._id });

    // Renvoie du user et du token
    return res.status(200).send({ token, user, userProfil });
  } catch (err) {
    return res.status(422).send({ error: "Email ou mot de passe invalide" });
  }
});

// Pour la sauvegarde des changement des informations du profil
router.post("/savechangesprofil", async (req, res) => {
  const {
    pseudo,
    sexe,
    facebook,
    instagram,
    twitter,
    website,
    description,
    token,
  } = req.body;

  // extration du userId du token
  jwt.verify(token, "MY_SECRET_KEY", async (err, payload) => {
    if (err) {
      return res.status(401).send({ error: "Problème de token" });
    }

    // Mise à jour des information dans la BDD
    await UserProfil.updateOne(
      {
        userId: payload.userId,
      },
      {
        pseudo: pseudo,
        sexe: sexe,
        facebook: facebook,
        instagram: instagram,
        twitter: twitter,
        website: website,
        description: description,
      }
    );

    // Mise à jour coté mongoose
    const userProfil = await UserProfil.findOne({ userId: payload.userId });
    await userProfil.save();
    return res.status(200).send({ userProfil, token });
  });
});

// Pour la sauvegarde l'avatar du profil
router.post("/saveavatarprofil", async (req, res) => {
  const { avatar, token } = req.body;

  // extration du userId du token
  jwt.verify(token, "MY_SECRET_KEY", async (err, payload) => {
    if (err) {
      return res.status(401).send({ error: "Problème de token" });
    }

    // Mise à jour des information dans la BDD
    await UserProfil.updateOne(
      {
        userId: payload.userId,
      },
      {
        avatar: avatar,
      }
    );

    // Mise à jour coté mongoose
    const userProfil = await UserProfil.findOne({ userId: payload.userId });
    await userProfil.save();
    return res.status(200).send({ userProfil, token });
  });
});

// Pour mettre à jour le mot de passe
router.post("/passwordupdate", async (req, res) => {
  const { oldPassword, newPassword, token } = req.body;

  // Check du token
  jwt.verify(token, "MY_SECRET_KEY", async (err, payload) => {
    if (err) {
      return res.status(401).send({ error: "Problème de token" });
    }

    // Comparaison avec le mot de passe actuel
    const user = await User.findOne({ _id: payload.userId });
    console.log("UN USER", user);
    try {
      await user.comparePassword(oldPassword);
    } catch (error) {
      return res
        .status(422)
        .send({ error: "Votre mot de passe actuel est incorrecte" });
    }

    // Mise à jour des informations dans la BDD
    await User.updateOne(
      {
        _id: payload.userId,
      },
      {
        password: newPassword,
      }
    );

    // Mise à jour coté mongoose
    await user.save();
    return res.status(200).send({ token });
  });
});

// Réinitialisation du mot de passe
router.post("/restore_password", async (req, res) => {
  const { email } = req.body;

  // retrouver le mail
  try {
    const user = await User.findOne({ email: email });
  } catch (error) {
    return res
      .status(422)
      .send({ error: "L'email est inconnue" });
  }

  // Génération d'un mot de passe aléatoire
  await User.updateOne(
    {
      password: newPassword,
    }
  );

  // Mise à jour coté mongoose
  await user.save();
  return res.status(200).send({ token });
});

// Remonte les informations sur le profil
router.get("/get_user_profil", async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(422).send({ error: "Utilisateur inconnu" });
  }

  // extration du userId du token
  jwt.verify(token, "MY_SECRET_KEY", async (err, payload) => {
    if (err) {
      return res.status(401).send({ error: "Problème de token" });
    }
    const userProfil = await UserProfil.findOne({ userId: payload.userId });
    // console.log("UserProfil", userProfil);
    if (!userProfil) {
      return res.status(422).send({ error: "Utilisateur non trouvé en BDD" });
    } else {
      return res.status(200).send({ token, userProfil });
    }
  });
});

// Pour l'inscription
router.post("/signup", async (req, res) => {
  const emailRegexp = /^[a-zA-Z0-9.!#$%&'+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)$/;
  const passwordRegexp = /^.{8,}$/;
  const { email, password, pseudo } = req.body;

  // Test de l'adresse mail et le mot de passe
  if (!emailRegexp.test(email) || !passwordRegexp.test(password)) {
    return res.status(422).send({ error: "Erreur inscription" });
  } else {
    try {
      const user = new User({
        email,
        password,
      });
      await user.save();

      //Chercher le userID
      const userTemp = User.findOne({ email });

      // Transmission userID et du pseudo pour renseigner la tablea UserProfil en BDD
      if (!userTemp) {
        return res.status(503).send({ error: "User inexistant" });
      } else {
        const userProfil = new UserProfil({
          userId: user._id,
          pseudo,
        });
        await userProfil.save();
      }
      // Création du token
      const token = jwt.sign({ userId: user._id }, "MY_SECRET_KEY");
      res.status(200).send({ token });
    } catch (err) {
      return res.status(422).send(err.message);
    }
  }
});
module.exports = router;
