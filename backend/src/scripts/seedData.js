/**
 * Demo data used by the seed script and the automated tests.
 * All names respect the 20-60 character rule, all passwords the password rule.
 */

const ADMIN_PASSWORD = 'Admin@1234';
const OWNER_PASSWORD = 'Admin@1234';
const USER_PASSWORD = 'User@1234';

const users = [
  { key: 'admin', name: 'System Administrator Main', email: 'admin@example.com', address: 'Head Office, 1 MG Road, Pune, Maharashtra 411001', role: 'ADMIN', password: ADMIN_PASSWORD },

  { key: 'owner', name: 'Rajesh Kumar Store Owner', email: 'owner@example.com', address: '12 FC Road, Shivajinagar, Pune, Maharashtra 411005', role: 'OWNER', password: OWNER_PASSWORD },
  { key: 'owner2', name: 'Priya Deshmukh Store Owner', email: 'owner2@example.com', address: '45 Linking Road, Bandra West, Mumbai, Maharashtra 400050', role: 'OWNER', password: OWNER_PASSWORD },
  { key: 'owner3', name: 'Anil Mehta Bakery Store Owner', email: 'owner3@example.com', address: '78 Brigade Road, Bengaluru, Karnataka 560001', role: 'OWNER', password: OWNER_PASSWORD },

  { key: 'rahul', name: 'Rahul Sharma Demo Customer', email: 'user@example.com', address: '221 Baner Road, Pune, Maharashtra 411045', role: 'USER', password: USER_PASSWORD },
  { key: 'amit', name: 'Amit Patil Regular Customer', email: 'amit@example.com', address: '9 Kothrud Depot Road, Pune, Maharashtra 411038', role: 'USER', password: USER_PASSWORD },
  { key: 'sneha', name: 'Sneha Kulkarni Frequent Shopper', email: 'sneha@example.com', address: '17 Andheri East, Mumbai, Maharashtra 400069', role: 'USER', password: USER_PASSWORD },
  { key: 'vikram', name: 'Vikram Singh Rathore Customer', email: 'vikram@example.com', address: '5 Civil Lines, Jaipur, Rajasthan 302006', role: 'USER', password: USER_PASSWORD },
  { key: 'neha', name: 'Neha Gupta Weekend Shopper Account', email: 'neha@example.com', address: '33 Indiranagar 100ft Road, Bengaluru, Karnataka 560038', role: 'USER', password: USER_PASSWORD },
];

const stores = [
  { key: 'sunrise', name: 'Sunrise Fresh Mart', email: 'contact@sunrisemart.example.com', address: '14 FC Road, Shivajinagar, Pune, Maharashtra 411005', owner: 'owner' },
  { key: 'sunriseElec', name: 'Sunrise Electronics Hub', email: 'hello@sunriseelectronics.example.com', address: '88 JM Road, Deccan Gymkhana, Pune, Maharashtra 411004', owner: 'owner' },
  { key: 'greenleaf', name: 'Green Leaf Organics', email: 'care@greenleaf.example.com', address: '47 Linking Road, Bandra West, Mumbai, Maharashtra 400050', owner: 'owner2' },
  { key: 'golden', name: 'Golden Crust Bakery', email: 'orders@goldencrust.example.com', address: '80 Brigade Road, Bengaluru, Karnataka 560001', owner: 'owner3' },
  { key: 'books', name: 'City Book Corner', email: 'info@citybookcorner.example.com', address: '2 Connaught Place, New Delhi, Delhi 110001', owner: 'owner3' },
];

// [user, store, rating]
const ratings = [
  ['rahul', 'sunrise', 5],
  ['amit', 'sunrise', 4],
  ['sneha', 'sunrise', 4],
  ['vikram', 'sunrise', 3],
  ['rahul', 'sunriseElec', 4],
  ['neha', 'sunriseElec', 5],
  ['sneha', 'greenleaf', 5],
  ['amit', 'greenleaf', 3],
  ['neha', 'greenleaf', 4],
  ['rahul', 'golden', 3],
  ['vikram', 'golden', 2],
];

module.exports = { users, stores, ratings, ADMIN_PASSWORD, OWNER_PASSWORD, USER_PASSWORD };
