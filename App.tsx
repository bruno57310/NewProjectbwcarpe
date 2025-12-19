<Route path="/catalog/private" element={
  <ProtectedRoute requiresSubscription>
    <PrivateCatalog />
  </ProtectedRoute>
}/>
