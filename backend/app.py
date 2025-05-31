from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configure SQLite database
# The three slashes /// mean the database file is in the current directory
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///portfolio.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define a Transaction model
class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False) # 'Buy' or 'Sell'
    quantity = db.Column(db.Float, nullable=False) # Changed to Float to match frontend
    price = db.Column(db.Float, nullable=False)
    amount_payable = db.Column(db.Float, nullable=True) # Made nullable for Sell transactions
    date = db.Column(db.String(50), nullable=False) # Storing date as string for now

    # Added fields for calculated values
    initial_investment = db.Column(db.Float, nullable=True)
    transaction_source = db.Column(db.String(50), nullable=True)
    initial_selling_amount = db.Column(db.Float, nullable=True)
    holding_type = db.Column(db.String(50), nullable=True)
    investment = db.Column(db.Float, nullable=True)
    broker_commission = db.Column(db.Float, nullable=True)
    sebon_fee = db.Column(db.Float, nullable=True)
    dp_charge = db.Column(db.Float, nullable=True)
    total_commission = db.Column(db.Float, nullable=True)
    profit_before_tax = db.Column(db.Float, nullable=True)
    capital_gain_tax = db.Column(db.Float, nullable=True)
    net_profit_loss = db.Column(db.Float, nullable=True)
    net_profit_loss_percentage = db.Column(db.Float, nullable=True)
    amount_receivable = db.Column(db.Float, nullable=True)
    wacc = db.Column(db.Float, nullable=True) # Added WACC field

    def __repr__(self):
        return f'<Transaction {self.company} - {self.type}>'

# Create database tables
with app.app_context():
    # In a real application, you'd use Flask-Migrate for database schema changes
    # For this example, you might need to delete the old portfolio.db file
    # if you get database schema errors.
    db.create_all()

# Endpoint to add a new transaction
@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.json
    new_transaction = Transaction(
        company=data['company'],
        type=data['type'],
        quantity=data['quantity'],
        price=data['price'],
        amount_payable=data.get('amountPayable'), # Use .get for optional fields
        date=data['date'],

        # Include calculated fields from frontend
        initial_investment = data.get('initialInvestment'),
        transaction_source = data.get('transactionSource'),
        initial_selling_amount = data.get('initialSellingAmount'),
        holding_type = data.get('holdingType'),
        investment = data.get('investment'),
        broker_commission = data.get('brokerCommission'),
        sebon_fee = data.get('sebonFee'),
        dp_charge = data.get('dpCharge'),
        total_commission = data.get('totalCommission'),
        profit_before_tax = data.get('profitBeforeTax'),
        capital_gain_tax = data.get('capitalGainTax'),
        net_profit_loss = data.get('netProfitLoss'),
        net_profit_loss_percentage = data.get('netProfitLossPercentage'),
        amount_receivable = data.get('amountReceivable'),
        wacc = data.get('wacc') # Include WACC
    )
    db.session.add(new_transaction)
    db.session.commit()
    print(f"Received data: {data}")
    return jsonify({'message': 'Transaction added successfully!'}), 201

# Endpoint to get all transactions
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    transactions = Transaction.query.all()
    output = []
    for transaction in transactions:
        output.append({
            'id': transaction.id,
            'company': transaction.company,
            'type': transaction.type,
            'quantity': transaction.quantity,
            'price': transaction.price,
            'amountPayable': transaction.amount_payable,
            'date': transaction.date,
            'initialInvestment': transaction.initial_investment,
            'transactionSource': transaction.transaction_source,
            'initialSellingAmount': transaction.initial_selling_amount,
            'holdingType': transaction.holding_type,
            'investment': transaction.investment,
            'brokerCommission': transaction.broker_commission,
            'sebonFee': transaction.sebon_fee,
            'dpCharge': transaction.dp_charge,
            'totalCommission': transaction.total_commission,
            'profitBeforeTax': transaction.profit_before_tax,
            'capitalGainTax': transaction.capital_gain_tax,
            'netProfitLoss': transaction.net_profit_loss,
            'netProfitLossPercentage': transaction.net_profit_loss_percentage,
            'amountReceivable': transaction.amount_receivable,
            'wacc': transaction.wacc # Include WACC
        })
    return jsonify(output)

# Endpoint to update a transaction
@app.route('/api/transactions/<int:id>', methods=['PUT'])
def update_transaction(id):
    transaction = Transaction.query.get_or_404(id)
    data = request.json
    transaction.company = data.get('company', transaction.company)
    transaction.type = data.get('type', transaction.type)
    transaction.quantity = data.get('quantity', transaction.quantity)
    transaction.price = data.get('price', transaction.price)
    transaction.amount_payable = data.get('amountPayable', transaction.amount_payable)
    transaction.date = data.get('date', transaction.date)
    transaction.initial_investment = data.get('initialInvestment', transaction.initial_investment)
    transaction.transaction_source = data.get('transactionSource', transaction.transaction_source)
    transaction.initial_selling_amount = data.get('initialSellingAmount', transaction.initial_selling_amount)
    transaction.holding_type = data.get('holdingType', transaction.holding_type)
    transaction.investment = data.get('investment', transaction.investment)
    transaction.broker_commission = data.get('brokerCommission', transaction.broker_commission)
    transaction.sebon_fee = data.get('sebonFee', transaction.sebon_fee)
    transaction.dp_charge = data.get('dpCharge', transaction.dp_charge)
    transaction.total_commission = data.get('totalCommission', transaction.total_commission)
    transaction.profit_before_tax = data.get('profitBeforeTax', transaction.profit_before_tax)
    transaction.capital_gain_tax = data.get('capitalGainTax', transaction.capital_gain_tax)
    transaction.net_profit_loss = data.get('netProfitLoss', transaction.net_profit_loss)
    transaction.net_profit_loss_percentage = data.get('netProfitLossPercentage', transaction.net_profit_loss_percentage)
    transaction.amount_receivable = data.get('amountReceivable', transaction.amount_receivable)
    transaction.wacc = data.get('wacc', transaction.wacc)
    db.session.commit()
    return jsonify({'message': f'Transaction {id} updated successfully!'})

# Endpoint to delete a transaction
@app.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    transaction = Transaction.query.get_or_404(id)
    db.session.delete(transaction)
    db.session.commit()
    return jsonify({'message': f'Transaction {id} deleted successfully!'})

if __name__ == '__main__':
    app.run(debug=True) 