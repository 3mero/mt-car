import type { Item } from "@/types/item"

const DB_NAME = "maintenance-tracker"
const STORE_NAME = "items"
const DB_VERSION = 1

// Función auxiliar para manejar errores de IndexedDB de manera consistente
function handleIndexedDBError(error: any, operation: string): Error {
  console.error(`IndexedDB error during ${operation}:`, error)
  return new Error(`Error en la operación de base de datos: ${operation}`)
}

// Función para verificar si IndexedDB está disponible
function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== "undefined" && "indexedDB" in window
  } catch (e) {
    return false
  }
}

// Open the database connection with better error handling
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      if (!isIndexedDBAvailable()) {
        reject(new Error("IndexedDB no es compatible con este navegador"))
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      // Establecer un tiempo límite para la apertura de la base de datos
      const timeoutId = setTimeout(() => {
        reject(new Error("Tiempo de espera agotado al abrir la base de datos"))
      }, 5000) // 5 segundos de tiempo límite

      request.onerror = (event) => {
        clearTimeout(timeoutId)
        const error = (event.target as IDBOpenDBRequest).error
        reject(handleIndexedDBError(error, "abrir base de datos"))
      }

      request.onsuccess = (event) => {
        clearTimeout(timeoutId)
        const db = (event.target as IDBOpenDBRequest).result

        // Configurar manejadores de errores globales para la base de datos
        db.onerror = (event) => {
          console.error("Database error:", event)
        }

        resolve(db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" })
        }
      }
    } catch (error) {
      reject(handleIndexedDBError(error, "inicializar base de datos"))
    }
  })
}

// Check if the database is empty and add sample data if needed
export async function initializeDB(): Promise<void> {
  try {
    // No longer adding sample data automatically
    console.log("Database initialized")
  } catch (error) {
    console.error("Error initializing database:", error)
  }
}

// Get all items from the database with improved error handling
export async function getAllItems(): Promise<Item[]> {
  let db: IDBDatabase | null = null

  try {
    if (!isIndexedDBAvailable()) {
      console.error("IndexedDB is not available")
      return []
    }

    db = await openDB()

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, "readonly")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.getAll()

        // Establecer un tiempo límite para la operación
        const timeoutId = setTimeout(() => {
          reject(new Error("Tiempo de espera agotado al obtener elementos"))
        }, 3000) // 3 segundos de tiempo límite

        request.onsuccess = () => {
          clearTimeout(timeoutId)
          resolve(request.result || [])
        }

        request.onerror = () => {
          clearTimeout(timeoutId)
          reject(handleIndexedDBError(request.error, "obtener elementos"))
        }

        transaction.oncomplete = () => {
          if (db) db.close()
        }

        transaction.onerror = () => {
          clearTimeout(timeoutId)
          reject(handleIndexedDBError(transaction.error, "transacción de lectura"))
        }
      } catch (error) {
        reject(handleIndexedDBError(error, "configurar transacción de lectura"))
      }
    })
  } catch (error) {
    console.error("Error in getAllItems:", error)
    return []
  } finally {
    // Asegurarse de que la base de datos se cierre en caso de error
    if (db) {
      try {
        db.close()
      } catch (closeError) {
        console.error("Error closing database:", closeError)
      }
    }
  }
}

// Get a specific item by ID with improved error handling
export async function getItemById(id: string): Promise<Item | null> {
  if (!id) {
    console.error("Invalid ID provided to getItemById:", id)
    return null
  }

  let db: IDBDatabase | null = null

  try {
    if (!isIndexedDBAvailable()) {
      console.error("IndexedDB is not available")
      return null
    }

    console.log(`Attempting to fetch item with ID: ${id}`)
    db = await openDB()

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, "readonly")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(id)

        // Establecer un tiempo límite para la operación
        const timeoutId = setTimeout(() => {
          reject(new Error("Tiempo de espera agotado al obtener elemento por ID"))
        }, 3000) // 3 segundos de tiempo límite

        request.onsuccess = () => {
          clearTimeout(timeoutId)
          if (request.result) {
            console.log(`Item found:`, request.result)
            resolve(request.result)
          } else {
            console.log(`No item found with ID: ${id}`)
            resolve(null)
          }
        }

        request.onerror = () => {
          clearTimeout(timeoutId)
          reject(handleIndexedDBError(request.error, "obtener elemento por ID"))
        }

        transaction.oncomplete = () => {
          if (db) db.close()
        }

        transaction.onerror = () => {
          clearTimeout(timeoutId)
          reject(handleIndexedDBError(transaction.error, "transacción de lectura por ID"))
        }
      } catch (error) {
        reject(handleIndexedDBError(error, "configurar transacción de lectura por ID"))
      }
    })
  } catch (error) {
    console.error("Error in getItemById:", error)
    return null
  } finally {
    // Asegurarse de que la base de datos se cierre en caso de error
    if (db) {
      try {
        db.close()
      } catch (closeError) {
        console.error("Error closing database:", closeError)
      }
    }
  }
}

// Save a new item to the database with improved error handling
export async function saveItem(item: Item): Promise<void> {
  if (!item || !item.id) {
    throw new Error("Invalid item data: Item must have an ID")
  }

  let db: IDBDatabase | null = null

  try {
    if (!isIndexedDBAvailable()) {
      throw new Error("IndexedDB is not available")
    }

    db = await openDB()

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, "readwrite")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.put(item) // Using put instead of add to handle both add and update

        // Establecer un tiempo límite para la operación
        const timeoutId = setTimeout(() => {
          reject(new Error("Tiempo de espera agotado al guardar elemento"))
        }, 3000) // 3 segundos de tiempo límite

        request.onsuccess = () => {
          clearTimeout(timeoutId)
          console.log(`Item saved successfully with ID: ${item.id}`)
          resolve()
        }

        request.onerror = () => {
          clearTimeout(timeoutId)
          reject(handleIndexedDBError(request.error, "guardar elemento"))
        }

        transaction.oncomplete = () => {
          if (db) db.close()
        }

        transaction.onerror = () => {
          clearTimeout(timeoutId)
          reject(handleIndexedDBError(transaction.error, "transacción de escritura"))
        }
      } catch (error) {
        reject(handleIndexedDBError(error, "configurar transacción de escritura"))
      }
    })
  } catch (error) {
    console.error("Error in saveItem:", error)
    throw error
  } finally {
    // Asegurarse de que la base de datos se cierre en caso de error
    if (db) {
      try {
        db.close()
      } catch (closeError) {
        console.error("Error closing database:", closeError)
      }
    }
  }
}

// Update an existing item with improved error handling
export async function updateItem(item: Item): Promise<void> {
  if (!item || !item.id) {
    throw new Error("Invalid item data: Item must have an ID")
  }

  let db: IDBDatabase | null = null

  try {
    if (!isIndexedDBAvailable()) {
      throw new Error("IndexedDB is not available")
    }

    db = await openDB()

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, "readwrite")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.put(item)

        // Establecer un tiempo límite para la operación
        const timeoutId = setTimeout(() => {
          reject(new Error("Tiempo de espera agotado al actualizar elemento"))
        }, 3000) // 3 segundos de tiempo límite

        request.onsuccess = () => {
          clearTimeout(timeoutId)
          console.log(`Item updated successfully with ID: ${item.id}`)
          resolve()
        }

        request.onerror = () => {
          clearTimeout(timeoutId)
          reject(handleIndexedDBError(request.error, "actualizar elemento"))
        }

        transaction.oncomplete = () => {
          if (db) db.close()
        }

        transaction.onerror = () => {
          clearTimeout(timeoutId)
          reject(handleIndexedDBError(transaction.error, "transacción de actualización"))
        }
      } catch (error) {
        reject(handleIndexedDBError(error, "configurar transacción de actualización"))
      }
    })
  } catch (error) {
    console.error("Error in updateItem:", error)
    throw error
  } finally {
    // Asegurarse de que la base de datos se cierre en caso de error
    if (db) {
      try {
        db.close()
      } catch (closeError) {
        console.error("Error closing database:", closeError)
      }
    }
  }
}

// Delete an item by ID with completely rewritten error handling
export async function deleteItem(id: string): Promise<void> {
  if (!id) {
    throw new Error("Invalid ID provided to deleteItem")
  }

  let db: IDBDatabase | null = null

  try {
    if (!isIndexedDBAvailable()) {
      throw new Error("IndexedDB is not available")
    }

    db = await openDB()

    return new Promise((resolve, reject) => {
      try {
        // Crear una nueva transacción para cada operación
        const transaction = db.transaction(STORE_NAME, "readwrite")

        // Establecer un tiempo límite para la operación
        const timeoutId = setTimeout(() => {
          if (db) {
            try {
              db.close()
            } catch (e) {
              console.error("Error closing database after timeout:", e)
            }
          }
          reject(new Error("Tiempo de espera agotado al eliminar elemento"))
        }, 3000) // 3 segundos de tiempo límite

        // Configurar manejadores de eventos para la transacción
        transaction.onabort = () => {
          clearTimeout(timeoutId)
          console.error("Transaction aborted:", transaction.error)
          reject(new Error("La transacción fue abortada"))
        }

        transaction.onerror = () => {
          clearTimeout(timeoutId)
          console.error("Transaction error:", transaction.error)
          reject(new Error("Error en la transacción de eliminación"))
        }

        transaction.oncomplete = () => {
          clearTimeout(timeoutId)
          console.log(`Transaction completed for deleting item with ID: ${id}`)
          resolve()
        }

        const store = transaction.objectStore(STORE_NAME)
        const request = store.delete(id)

        request.onsuccess = () => {
          console.log(`Delete request successful for item with ID: ${id}`)
          // No llamamos a resolve() aquí, dejamos que transaction.oncomplete lo haga
        }

        request.onerror = () => {
          clearTimeout(timeoutId)
          console.error("Delete request error:", request.error)
          reject(new Error("Error al eliminar el elemento"))
        }
      } catch (error) {
        console.error("Error setting up delete transaction:", error)
        reject(new Error("Error al configurar la transacción de eliminación"))
      } finally {
        // Asegurarse de que la base de datos se cierre después de la operación
        setTimeout(() => {
          if (db) {
            try {
              db.close()
              console.log("Database closed in finally block of deleteItem")
            } catch (closeError) {
              console.error("Error closing database in finally block of deleteItem:", closeError)
            }
          }
        }, 100)
      }
    })
  } catch (error) {
    console.error("Error in deleteItem:", error)
    throw new Error("Error al eliminar el elemento: " + (error instanceof Error ? error.message : String(error)))
  }
}

// Clear all items from the database - completely rewritten
export async function clearAllItems(): Promise<void> {
  let db: IDBDatabase | null = null

  try {
    if (!isIndexedDBAvailable()) {
      throw new Error("IndexedDB is not available")
    }

    db = await openDB()

    return new Promise((resolve, reject) => {
      try {
        // Crear una nueva transacción para cada operación
        const transaction = db.transaction(STORE_NAME, "readwrite")

        // Establecer un tiempo límite para la operación
        const timeoutId = setTimeout(() => {
          if (db) {
            try {
              db.close()
            } catch (e) {
              console.error("Error closing database after timeout:", e)
            }
          }
          reject(new Error("Tiempo de espera agotado al limpiar elementos"))
        }, 5000) // 5 segundos de tiempo límite para esta operación más larga

        // Configurar manejadores de eventos para la transacción
        transaction.onabort = () => {
          clearTimeout(timeoutId)
          console.error("Clear transaction aborted:", transaction.error)
          reject(new Error("La transacción de limpieza fue abortada"))
        }

        transaction.onerror = () => {
          clearTimeout(timeoutId)
          console.error("Clear transaction error:", transaction.error)
          reject(new Error("Error en la transacción de limpieza"))
        }

        transaction.oncomplete = () => {
          clearTimeout(timeoutId)
          console.log("Clear transaction completed successfully")
          resolve()
        }

        const store = transaction.objectStore(STORE_NAME)
        const request = store.clear()

        request.onsuccess = () => {
          console.log("Clear request successful")
          // No llamamos a resolve() aquí, dejamos que transaction.oncomplete lo haga
        }

        request.onerror = () => {
          clearTimeout(timeoutId)
          console.error("Clear request error:", request.error)
          reject(new Error("Error al limpiar los elementos"))
        }
      } catch (error) {
        console.error("Error setting up clear transaction:", error)
        reject(new Error("Error al configurar la transacción de limpieza"))
      } finally {
        // Asegurarse de que la base de datos se cierre después de la operación
        setTimeout(() => {
          if (db) {
            try {
              db.close()
              console.log("Database closed in finally block of clearAllItems")
            } catch (closeError) {
              console.error("Error closing database in finally block of clearAllItems:", closeError)
            }
          }
        }, 100)
      }
    })
  } catch (error) {
    console.error("Error in clearAllItems:", error)
    throw new Error("Error al limpiar todos los elementos: " + (error instanceof Error ? error.message : String(error)))
  }
}

// Export all items to JSON with improved error handling
export async function exportItemsToJSON(): Promise<string> {
  try {
    const items = await getAllItems()
    return JSON.stringify(items, null, 2)
  } catch (error) {
    console.error("Error exporting items:", error)
    throw new Error("Error al exportar elementos: " + (error instanceof Error ? error.message : String(error)))
  }
}

// Import items from JSON with improved error handling
export async function importItemsFromJSON(jsonData: string): Promise<void> {
  try {
    let items: Item[] = []

    try {
      items = JSON.parse(jsonData) as Item[]
    } catch (parseError) {
      throw new Error(
        "Formato JSON inválido: " + (parseError instanceof Error ? parseError.message : String(parseError)),
      )
    }

    if (!Array.isArray(items)) {
      throw new Error("Formato JSON inválido: Se esperaba un array de elementos")
    }

    // Validate each item
    for (const item of items) {
      if (!item.id || !item.name) {
        throw new Error("Datos de elemento inválidos: Cada elemento debe tener un ID y un nombre")
      }
    }

    // Clear existing items
    await clearAllItems()

    // Add new items one by one
    for (const item of items) {
      await saveItem(item)
    }

    console.log(`Imported ${items.length} items successfully`)
  } catch (error) {
    console.error("Error importing items:", error)
    throw new Error("Error al importar elementos: " + (error instanceof Error ? error.message : String(error)))
  }
}

// Debug function to log all items in the database
export async function debugLogAllItems(): Promise<void> {
  try {
    const items = await getAllItems()
    console.log("All items in database:", items)
  } catch (error) {
    console.error("Error logging items:", error)
  }
}
