import axios from "axios";
import { useEffect, useState } from "react";

export default function Transactions() {
  const [tx, setTx] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/transactions')
      .then(res => setTx(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <ul>
      {tx.map(t => (
        <li key={t.id}>{t.category} - ${t.amount}</li>
      ))}
    </ul>
  );
}
