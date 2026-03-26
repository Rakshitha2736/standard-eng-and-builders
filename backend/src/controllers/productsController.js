import { products } from "../data/products.js";
import { ObjectId } from "mongodb";
import { getProductsCollection } from "../data/mongoClient.js";

const localProducts = [...products];

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMongoLookupFilter(idOrObjectId) {
  const normalizedId = String(idOrObjectId || "").trim();

  if (!normalizedId) {
    return { id: "" };
  }

  if (ObjectId.isValid(normalizedId)) {
    return {
      $or: [{ id: normalizedId }, { _id: new ObjectId(normalizedId) }]
    };
  }

  return { id: normalizedId };
}

function mapLegacySpecs(specs = {}) {
  return {
    material: String(specs.material || "").trim(),
    operation: String(specs.operation || "").trim(),
    width: String(specs.width || "").trim(),
    finish: String(specs.finish || "").trim()
  };
}

function normalizeMongoProductDocument(document = {}) {
  const {
    _id,
    specifications,
    unitPrice,
    createdBy,
    stock,
    minStock,
    unit,
    grade,
    isActive,
    __v,
    ...rest
  } = document;

  const fallbackSpecs = specifications
    ? {
        material: specifications.material || "",
        operation: specifications.dimensions || specifications.operation || "",
        width: specifications.weight || specifications.width || "",
        finish: specifications.finish || ""
      }
    : {};

  const normalizedSpecs = mapLegacySpecs({
    ...fallbackSpecs,
    ...(rest.specs || {})
  });

  const normalizedId = String(rest.id || (_id ? String(_id) : "")).trim();
  const normalizedDescription = String(rest.description || "").trim();
  const normalizedImage = String(rest.image || specifications?.image || "").trim();
  const normalizedPrice = String(
    rest.price || (typeof unitPrice === "number" ? `${unitPrice}` : unitPrice || "")
  ).trim();
  const normalizedShortDescription =
    String(rest.shortDescription || "").trim() ||
    (normalizedDescription ? `${normalizedDescription.slice(0, 130)}...` : "");

  return {
    ...rest,
    id: normalizedId,
    shortDescription: normalizedShortDescription,
    description: normalizedDescription,
    image: normalizedImage,
    price: normalizedPrice,
    specs: normalizedSpecs
  };
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function buildSpecs(input = {}, { isUpdate = false } = {}) {
  if (!isUpdate) {
    return {
      material: String(input.material || "").trim(),
      operation: String(input.operation || "").trim(),
      width: String(input.width || "").trim(),
      finish: String(input.finish || "").trim()
    };
  }

  const partialSpecs = {};

  if (hasOwn(input, "material")) {
    partialSpecs.material = String(input.material || "").trim();
  }

  if (hasOwn(input, "operation")) {
    partialSpecs.operation = String(input.operation || "").trim();
  }

  if (hasOwn(input, "width")) {
    partialSpecs.width = String(input.width || "").trim();
  }

  if (hasOwn(input, "finish")) {
    partialSpecs.finish = String(input.finish || "").trim();
  }

  return partialSpecs;
}

function normalizeProductPayload(payload = {}, { isUpdate = false } = {}) {
  if (!isUpdate) {
    const normalized = {
      name: String(payload.name || "").trim(),
      category: String(payload.category || "").trim(),
      shortDescription: String(payload.shortDescription || "").trim(),
      description: String(payload.description || "").trim(),
      image: String(payload.image || "").trim(),
      price: String(payload.price || "").trim(),
      specs: buildSpecs(payload.specs)
    };

    if (!normalized.name || !normalized.category) {
      return { error: "Product name and category are required" };
    }

    return { value: normalized };
  }

  const normalized = {};

  if (hasOwn(payload, "name")) {
    normalized.name = String(payload.name || "").trim();
  }

  if (hasOwn(payload, "category")) {
    normalized.category = String(payload.category || "").trim();
  }

  if (hasOwn(payload, "shortDescription")) {
    normalized.shortDescription = String(payload.shortDescription || "").trim();
  }

  if (hasOwn(payload, "description")) {
    normalized.description = String(payload.description || "").trim();
  }

  if (hasOwn(payload, "image")) {
    normalized.image = String(payload.image || "").trim();
  }

  if (hasOwn(payload, "price")) {
    normalized.price = String(payload.price || "").trim();
  }

  if (hasOwn(payload, "specs")) {
    normalized.specs = buildSpecs(payload.specs || {}, { isUpdate: true });
  }

  if (!Object.keys(normalized).length) {
    return { error: "At least one product field is required" };
  }

  if (hasOwn(normalized, "name") && !normalized.name) {
    return { error: "Product name cannot be empty" };
  }

  if (hasOwn(normalized, "category") && !normalized.category) {
    return { error: "Product name and category are required" };
  }

  return { value: normalized };
}

function mergeProduct(existingProduct, updates) {
  const now = new Date().toISOString();

  return {
    ...existingProduct,
    ...updates,
    specs: {
      ...(existingProduct.specs || {}),
      ...(updates.specs || {})
    },
    updatedAt: now
  };
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
    const normalizedItems = items.map((item) => normalizeMongoProductDocument(item));
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
    const product = await productsCollection.findOne(buildMongoLookupFilter(req.params.id));

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const normalizedProduct = normalizeMongoProductDocument(product);
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

    localProducts[index] = mergeProduct(localProducts[index], value);

    res.json(localProducts[index]);
    return;
  }

  try {
    const lookupFilter = buildMongoLookupFilter(req.params.id);
    const existingProductDoc = await productsCollection.findOne(lookupFilter);

    if (!existingProductDoc) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const existingProduct = normalizeMongoProductDocument(existingProductDoc);
    const updatedProduct = mergeProduct(existingProduct, value);

    const result = await productsCollection.updateOne(lookupFilter, { $set: updatedProduct });

    if (!result.matchedCount) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

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
    const result = await productsCollection.deleteOne(buildMongoLookupFilter(req.params.id));

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
