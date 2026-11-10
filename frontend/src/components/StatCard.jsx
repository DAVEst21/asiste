import React from 'react';

export default function StatCard({ title, value, icon: Icon, tone = 'blue', detail }) {
    return (
        <article className={`stat-card tone-${tone}`}>
            <div className="stat-card-top">
                <p>{title}</p>
                <span className="stat-icon">
                    <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                </span>
            </div>
            <strong className="stat-value">{value}</strong>
            {detail && <p className="stat-detail">{detail}</p>}
        </article>
    );
}
