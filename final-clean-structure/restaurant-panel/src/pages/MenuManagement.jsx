import MenuForm from "../components/restaurant/MenuForm.jsx";
import { addFoodItem } from "../services/restaurantService.js";
import { toast } from "../utils/toast.js";

export default function MenuManagement() {
  const submit = async ({ restaurantId, payload }) => {
    try {
      await addFoodItem(restaurantId, payload);
      toast.success("Food item added successfully");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1>Menu Management</h1>
        <p className="muted">
          Add food items with calories and tags for AI recommendation and health filtering.
        </p>
        <MenuForm onSubmit={submit} />
      </div>
    </section>
  );
}
