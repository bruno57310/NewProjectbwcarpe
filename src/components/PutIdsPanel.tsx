import React, { useState } from "react";
import { Send, CheckCircle, AlertCircle, RefreshCw, Info } from "lucide-react";
import { sendToN8n } from "../lib/n8nService";

export default function PutIdsPanel() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customId, setCustomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseDetails, setResponseDetails] = useState<string | null>(null);

  const availableIds = ["id1", "id2", "id3", "id4"];

  const toggleId = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else if (selectedIds.length < 4) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const addCustomId = () => {
    if (customId.trim() && !selectedIds.includes(customId) && selectedIds.length < 4) {
      setSelectedIds([...selectedIds, customId.trim()]);
      setCustomId("");
    }
  };

  const handleSendToN8n = async () => {
    if (selectedIds.length < 2 || selectedIds.length > 4) {
      setError("Select between 2 and 4 IDs.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    setResponseDetails(null);

    try {
      const result = await sendToN8n(selectedIds);
      setResponseDetails(JSON.stringify(result, null, 2));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-lg bg-white shadow">
      <div className="mb-4">
        <h4 className="font-medium">Selected IDs ({selectedIds.length}/4)</h4>
        <div className="flex gap-2 mt-2 flex-wrap">
          {selectedIds.map(id => (
            <span
              key={id}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
            >
              {id}
              <button
                className="ml-1 text-blue-600"
                onClick={() => toggleId(id)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex mt-2">
          <input
            value={customId}
            onChange={e => setCustomId(e.target.value)}
            placeholder="Custom ID"
            className="border p-2 rounded mr-2"
          />
          <button
            disabled={!customId.trim() || selectedIds.length >= 4}
            onClick={addCustomId}
            className="bg-blue-600 text-white px-3 py-2 rounded"
          >
            Add
          </button>
        </div>
        <div className="mt-4">
          <h4 className="font-medium mb-2">Quick IDs</h4>
          {availableIds.map(id => (
            <button
              key={id}
              onClick={() => toggleId(id)}
              className={`mr-2 mb-2 px-3 py-1 rounded-full ${
                selectedIds.includes(id)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {id}
            </button>
          ))}
        </div>
      </div>
      <button
        disabled={loading || selectedIds.length < 2}
        onClick={handleSendToN8n}
        className={`px-4 py-2 rounded text-white flex items-center gap-2 ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : success
            ? "bg-green-600"
            : "bg-blue-600"
        }`}
      >
        {loading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
        {success && <CheckCircle className="w-4 h-4 mr-2" />}
        {!loading && !success && <Send className="w-4 h-4 mr-2" />}
        {loading ? "Sending..." : success ? "Sent!" : "Send IDs"}
      </button>
      {error && (
        <div className="text-red-600 mt-4 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" /> {error}
        </div>
      )}
      {responseDetails && (
        <pre className="bg-gray-100 p-2 mt-4 text-xs overflow-x-auto rounded border">
          {responseDetails}
        </pre>
      )}
      <div className="mt-4 text-xs text-gray-500 border-t pt-2">
        IDs must be between 2 and 4, can be any string.
      </div>
    </div>
  );
}
