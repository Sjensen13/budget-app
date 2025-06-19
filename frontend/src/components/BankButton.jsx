import { usePlaidLink } from 'react-plaid-link';

function BankButton() {
  const onSuccess = async (public_token) => {
    const res = await fetch("http://localhost:5000/exchange_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_token }),
    });
    const data = await res.json();
    console.log("Access token response:", data);
  };

  const config = {
    token: "<GENERATED_LINK_TOKEN>",
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  return <button onClick={() => open()} disabled={!ready}>Link Bank</button>;
}

export default BankButton;
