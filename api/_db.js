const firebaseAdmin = require("./_firebase");

const firestore = firebaseAdmin.firestore();

/**** USERS ****/

// Get user by uid
function getUser(uid) {
  return firestore.collection("users").doc(uid).get().then(format);
}

function createUser(uid, email){
  return firestore.collection("users").doc(uid).set({email: email, credit: 0, extraCredit:0});
}

// Get user by stripeCustomerId
function getUserByCustomerId(customerId, type='stripe') {
  return firestore
    .collection("users")
    .where(`${type}CustomerId`, "==", customerId)
    .get()
    .then(format)
    .then((docs) => (docs ? docs[0] : null)); // Get first result
}

function getUserByEmail(email) {
  return firestore
    .collection("users")
    .where("email", "==", email)
    .get()
    .then(format)
    .then((docs) => (docs ? docs[0] : null)); // Get first result
}

function getSubscribedUsers(){
  // TODO: Modify to also include paypal subscribers
  return firestore
    .collection("users")
    .where("stripeSubscriptionStatus", "==", 'active')
    .get()
    .then(format)
}

function getItem(uid) {
  return firestore.collection("items").doc(uid).get().then(format);
}

function deleteItemsByOwner(ownerId) {
  const itemsRef = firestore.collection("items");

  return itemsRef.where("owner", "==", ownerId).get()
    .then(querySnapshot => {
      const batch = firestore.batch();

      querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      return batch.commit()
        .then(() => {
          // Return success status and message
          return {
            status: 'success',
            message: `All items owned by user ${ownerId} have been deleted.`
          };
        })
        .catch(error => {
          // Return error status and message
          return {
            status: 'error',
            message: `Error during deletion: ${error.message}`
          };
        });
    })
    .catch(error => {
      // Return error status and message
      return {
        status: 'error',
        message: `Error fetching items: ${error.message}`
      };
    });
}

// Update an existing user
function updateUser(uid, data) {
  return firestore.collection("users").doc(uid).update(data);
}

function updateItem(uid, data) {
  return firestore.collection("items").doc(uid).update(data);
}

function updateItemLikesCount(uid, val) {
  return firestore.collection("items").doc(uid).update({likesCount: firebaseAdmin.firestore.FieldValue.increment(val)});
}

function updateUserLikes(uid, val, remove=false){
  if (remove) {
    return firestore.collection("users").doc(uid).update({likes: firebaseAdmin.firestore.FieldValue.arrayRemove(val)});
  } else {
    return firestore.collection("users").doc(uid).update({likes: firebaseAdmin.firestore.FieldValue.arrayUnion(val)});
  }
}

// Update a user by their stripeCustomerId
function updateUserByCustomerId(customerId, data, type='stripe') {
  return getUserByCustomerId(customerId, type).then((user) => {
    return updateUser(user.id, data);
  });
}

function updateUserByEmail(email, data) {
  return getUserByEmail(email).then((user) => {
    return updateUser(user.id, data);
  });
}

function updateUserCredit(uid, val) {
  return firestore.collection("users").doc(uid).update({credit: val});
}

function updateUserCreditByCustomerId(customerId, val, type='stripe') {
  return getUserByCustomerId(customerId, type).then((user) => {
    return updateUserCredit(user.id, val)
  });
}

function updateUserCreditByEmail(email, val) {
  return getUserByEmail(email).then((user) => {
    return updateUserCredit(user.id, val)
  });
}

function IncrementUserCredit(uid, val) {
  return firestore.collection("users").doc(uid).update({credit: firebaseAdmin.firestore.FieldValue.increment(val)});
}

function IncrementUserExtraCredit(uid, val) {
  return firestore.collection("users").doc(uid).set({extraCredit: firebaseAdmin.firestore.FieldValue.increment(val)}, {merge: true});
}

function IncrementUserCreditByCustomerId(customerId, val, type='stripe') {
  return getUserByCustomerId(customerId, type).then((user) => {
    return IncrementUserCredit(user.id, val)
  });
}

function IncrementUserCreditByEmail(email, val) {
  return getUserByEmail(email).then((user) => {
    return IncrementUserCredit(user.id, val)
  });
}

function IncrementUserExtraCreditByCustomerId(customerId, val, type='stripe') {
  return getUserByCustomerId(customerId, type).then((user) => {
    return IncrementUserExtraCredit(user.id, val)
  });
}

function IncrementUserExtraCreditByEmail(email, val) {
  return getUserByEmail(email).then((user) => {
    return IncrementUserExtraCredit(user.id, val)
  });
}


/**** HELPERS ****/

// Format Firestore response
function format(response) {
  // Converts doc into object that contains data and `doc.id`
  const formatDoc = (doc) => ({ id: doc.id, ...doc.data() });
  if (response.docs) {
    // Handle a collection of docs
    return response.docs.map(formatDoc);
  } else {
    // Handle a single doc
    return response.exists ? formatDoc(response) : null;
  }
}

module.exports = {
  getUser,
  getSubscribedUsers,
  createUser,
  getItem,
  getUserByCustomerId,
  getUserByEmail,
  deleteItemsByOwner,
  updateItem,
  updateItemLikesCount,
  updateUserLikes,
  updateUser,
  updateUserByCustomerId,
  updateUserByEmail,
  updateUserCredit,
  updateUserCreditByCustomerId,
  updateUserCreditByEmail,
  IncrementUserCredit,
  IncrementUserExtraCredit,
  IncrementUserCreditByCustomerId,
  IncrementUserCreditByEmail,
  IncrementUserExtraCreditByCustomerId,
  IncrementUserExtraCreditByEmail
};
