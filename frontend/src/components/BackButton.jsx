import { useNavigate } from "react-router-dom";

function BackButton({ fallbackTo = "/", label = "Back" }) {
  const navigate = useNavigate();

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackTo);
  }

  return (
    <div className="back-button-row">
      <button type="button" className="btn btn-light back-button" onClick={handleBack}>
        {`< ${label}`}
      </button>
    </div>
  );
}

export default BackButton;
