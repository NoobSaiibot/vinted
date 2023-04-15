const express = require("express");
const router = express.Router();
// Import de fileupload qui nous permet de recevoir des formdata
const fileUpload = require("express-fileupload");
// Import de cloudinary
const cloudinary = require("cloudinary").v2;

const isAuthenticated = require("../middlewares/isAuthenticated");
const Offer = require("../models/Offer");
const convertToBase64 = require("../utils/convertToBase64");

////// Création de la route PUBLISH

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      // Récupération de la photo dans la clef
      const picture = req.files.picture;
      // Upload de mon image sur cloudinary, la réponse de cloudinay sera dans la variable result
      const result = await cloudinary.uploader.upload(
        convertToBase64(picture),
        { folder: "Vinted" }
      );
      // console.log(req.body);
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ETAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        product_image: result,
        owner: req.user,
      });

      // console.log(newOffer);
      await newOffer.save();
      res.status(201).json(newOffer);
    } catch (error) {
      res.status(400).json({ messsage: error.message });
    }
  }
);
////////

router.get("/offers", async (req, res) => {
  try {
    // console.log(req.query);

    const { title, priceMin, priceMax, sort, page } = req.query;

    const filter = {};
    if (title) {
      filter.product_name = RegExp(title, "i");
    } //Je créer une clef product_name dans filter
    // console.log(filter);
    if (priceMin) {
      filter.product_price = { $gte: priceMin };
    }
    // console.log(filter);
    if (priceMax) {
      if (filter.product_price) {
        filter.product_price.$lte = Number(priceMax);
      } else {
        filter.product_price = { $lte: Number(priceMax) };
      }
    }

    const sortFilter = {};

    if (sort === "price-desc") {
      sortFilter.product_price = -1;
    } else if (sort === "price-asc") {
      sortFilter.product_price = 1;
    }
    // console.log(filter);

    const limit = 5;
    // 5 résultats par page : 1 skip=0, 2 skip=5, 3 skip=10
    // 3 résultats par page : 1 skip=0, 2 skip=3, 3 skip=6 => quand je demande la page 3 j'ignore 6 résultats soit 2 fois le nombre de résultats par page.
    // skip = nombre de résultats par page * (numéro de page -1);

    let pageRequired = 1;
    if (page) {
      // Si page existe
      pageRequired = page;
    }

    const skip = (page - 1) * limit;
    const offers = await Offer.find(filter)
      .sort(sortFilter)
      .skip(skip)
      .limit(limit)
      .populate("owner", "account");

    const count = await Offer.countDocuments(filter);
    res.status(201).json({ count: count, offers: offers });
  } catch (error) {
    res.status(400).json({ messsage: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    res.status(201).json(offer);
  } catch (error) {
    res.status(400).json({ messsage: error.message });
  }
});
module.exports = router;
