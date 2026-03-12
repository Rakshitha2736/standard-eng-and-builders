import { products } from "../data/products.js";
import { getProductsCollection } from "../data/mongoClient.js";

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getProducts(req, res) {
  const { category } = req.query;
  const productsCollection = getProductsCollection();

  if (!productsCollection) {
    if (!category) {
      res.json(products);
      return;
    }

    const filteredProducts = products.filter(
      (product) => product.category.toLowerCase() === category.toLowerCase()
    );

    res.json(filteredProducts);
    return;
  }

  try {
    const query =
      category && category.trim()
        ? { category: { $regex: `^${escapeRegex(category.trim())}$`, $options: "i" } }
        : {};

    const items = await productsCollection.find(query).sort({ id: 1 }).toArray();
    const normalizedItems = items.map(({ _id, ...item }) => item);
    res.json(normalizedItems);
  } catch (error) {
    console.error("Failed to fetch products from MongoDB", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
}

export async function getProductById(req, res) {
  const productsCollection = getProductsCollection();

  if (!productsCollection) {
    const product = products.find((item) => item.id === req.params.id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.json(product);
    return;
  }

  try {
    const product = await productsCollection.findOne({ id: req.params.id });

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const { _id, ...normalizedProduct } = product;
    res.json(normalizedProduct);
  } catch (error) {
    console.error("Failed to fetch product from MongoDB", error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
}
