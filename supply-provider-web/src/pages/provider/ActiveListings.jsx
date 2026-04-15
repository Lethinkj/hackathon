import FoodListCard from '../../components/FoodListCard'

export default function ActiveListings({ foods }) {
    return (
        <>
            <div style={{ height: '12px' }} />
            <div className="section-header" style={{ padding: '0 14px 8px' }}><span className="section-title">Active listings ({foods.length})</span></div>
            {foods.map((food) => <FoodListCard key={food.id} food={food} />)}
        </>
    )
}
