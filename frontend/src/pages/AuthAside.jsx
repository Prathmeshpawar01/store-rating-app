import { BrandMark } from '../components/Sidebar';
import Icon from '../components/Icon';

const SAMPLE = [
  { name: 'Sunrise Fresh Mart', city: 'Pune', rating: 4.0 },
  { name: 'Green Leaf Organics', city: 'Mumbai', rating: 4.0 },
  { name: 'Golden Crust Bakery', city: 'Bengaluru', rating: 2.5 },
];

/** Left panel shared by the login and sign-up pages. */
export default function AuthAside({ heading, text }) {
  return (
    <aside className="auth-aside">
      <div className="brand" style={{ padding: 0 }}>
        <BrandMark />
        StoreRate
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1>{heading}</h1>
        <p style={{ color: '#aab3c5', maxWidth: '44ch' }}>{text}</p>
      </div>
      <div className="receipt" aria-hidden="true">
        {SAMPLE.map((s) => (
          <div className="receipt-row" key={s.name}>
            <div>
              <div className="receipt-store">{s.name}</div>
              <div className="receipt-city">{s.city}</div>
            </div>
            <span className="rating-pill">
              <Icon name="star" filled />
              {s.rating.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
