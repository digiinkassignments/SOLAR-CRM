import { useEffect, useState } from "react";
import axios from "../api/axios";

const usePlanFeatures = () => {
  const [features, setFeatures] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    axios.get("/subscription/status")
      .then((res) => {
        setFeatures(res.data.data?.plan || null);
      })
      .catch(() => setFeatures(null))
      .finally(() => setLoading(false));
  }, []);

  const can = (featureKey) => {
    if (!features) return false;
    // Enterprise — max_users = 0 means unlimited
    if (features.max_users === 0) return true;
    return !!features[featureKey];
  };

  return { features, loading, can };
};

export default usePlanFeatures;