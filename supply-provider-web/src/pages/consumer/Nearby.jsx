import FoodListCard from '../../components/FoodListCard'
export default function Nearby({ foods }) {
    return (
        <>
            <div style={{ background: 'var(--color-background-secondary)', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: '12px', margin: '12px 14px', borderRadius: '12px' }}>Map view · GPS enabled</div>
            <div className="section-header" style={{ padding: '0 14px 8px' }}><span className="section-title">Within 2 km</span></div>
            {foods.slice(0, 3).map((food) => <FoodListCard key={food.id} food={food} />)}
        </>
    )
}
