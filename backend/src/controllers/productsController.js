import { products } from "../data/products.js";
import { getProductsCollection } from "../data/mongoClient.js";

const localProducts = [...products];

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSpecs(input = {}) {
  return {
    material: String(input.material || "").trim(),
    operation: String(input.operation || "").trim(),
    width: String(input.width || "").trim(),
    finish: String(input.finish || "").trim()
  };
}

function normalizeProductPayload(payload = {}, { isUpdate = false } = {}) {
  const normalized = {
    name: String(payload.name || "").trim(),
    category: String(payload.category || "").trim(),
    shortDescription: String(payload.shortDescription || "").trim(),
    description: String(payload.description || "").trim(),
    image: String(payload.image || "").trim(),
    price: String(payload.price || "").trim(),
    specs: buildSpecs(payload.specs)
  };

  if (!isUpdate && (!normalized.name || !normalized.category)) {
    return { error: "Product name and category are required" };
  }

  if (isUpdate && !normalized.name && !normalized.category) {
    return { error: "Product name and category are required" };
  }

  return { value: normalized };
}

function buildProductId(name = "product") {
  const slug = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  const suffix = Date.now().toString(36).slice(-6);
  return `${slug || "product"}-${suffix}`;
}

export async function getProducts(req, res) {
  const { category } = req.query;
  const productsCollection = getProductsCollection();

  if (!productsCollection) {
    if (!category) {
      res.json(localProducts);
      return;
    }

    const filteredProducts = localProducts.filter(
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
    const product = localProducts.find((item) => item.id === req.params.id);

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

export async function createProduct(req, res) {
  const { value, error } = normalizeProductPayload(req.body);

  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  const newProduct = {
    id: buildProductId(value.name),
    ...value
  };

  const productsCollection = getProductsCollection();

  if (!productsCollection) {
    localProducts.push(newProduct);
    res.status(201).json(newProduct);
    return;
  }

  try {
    await productsCollection.insertOne(newProduct);
    res.status(201).json(newProduct);
  } catch (insertError) {
    console.error("Failed to create product in MongoDB", insertError);
    res.status(500).json({ message: "Failed to create product" });
  }
}

export async function updateProduct(req, res) {
  const { value, error } = normalizeProductPayload(req.body, { isUpdate: true });

  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  const productsCollection = getProductsCollection();

  if (!productsCollection) {
    const index = localProducts.findIndex((item) => item.id === req.params.id);

    if (index === -1) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    localProducts[index] = {
      ...localProducts[index],
      ...value
    };

    res.json(localProducts[index]);
    return;
  }

  try {
    const result = await productsCollection.updateOne(
      { id: req.params.id },
      { $set: value }
    );

    if (!result.matchedCount) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const updatedProductDoc = await productsCollection.findOne({ id: req.params.id });

    if (!updatedProductDoc) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const { _id, ...updatedProduct } = updatedProductDoc;
    res.json(updatedProduct);
  } catch (updateError) {
    console.error("Failed to update product in MongoDB", updateError);
    res.status(500).json({ message: "Failed to update product" });
  }
}

export async function deleteProduct(req, res) {
  const productsCollection = getProductsCollection();

  if (!productsCollection) {
    const index = localProducts.findIndex((item) => item.id === req.params.id);

    if (index === -1) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    localProducts.splice(index, 1);
    res.json({ message: "Product deleted" });
    return;
  }

  try {
    const result = await productsCollection.deleteOne({ id: req.params.id });

    if (!result.deletedCount) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.json({ message: "Product deleted" });
  } catch (deleteError) {
    console.error("Failed to delete product in MongoDB", deleteError);
    res.status(500).json({ message: "Failed to delete product" });
  }
}
