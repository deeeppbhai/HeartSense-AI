import { useState } from 'react';
import { clinicalService } from '../services/api';

export const useAssessment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAssessment = async (features) => {
    setLoading(true);
    setError(null);
    try {
      const res = await clinicalService.createAssessment(features);
      setLoading(false);
      return { success: true, data: res.data };
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.error || 'Inference failed. Please check inputs.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  return {
    runAssessment,
    loading,
    error,
  };
};

export default useAssessment;
