var someModel;

Ext.define("observui.view.data.Model",
{
	extend: "Ext.FormPanel",

	constructor: function (config, model)
	{
		var items = [];

		var targetClass = Ext.ClassManager.getClass(model);

		Ext.each(targetClass.getFields(), function (field)
		{
			items.push(this.createInput(field, model));
		}, this);

		config = Ext.apply({}, config,
		{
			items: items
		});

		this.callParent([config]);

		this.on("render", Ext.bind(this.setModel, this, [model], 0));
	},

	onClassLoaded: function ()
	{
		var targetClass = Ext.ClassManager.get(this.targetClassName);

		var fields = targetClass.getFields();

		Ext.each(fields, function (field)
		{
			this.add(this.createInput(field));
		}, this);
	},

	createInput: function (field, model)
	{
		try
		{
			return this["createFormInput" + Ext.util.Format.capitalize(field.type.type)](field, model);
		}
		catch (e)
		{
			return {
				xtype: "displayfield",
				fieldLabel: field.name,
				name:  field.name,
				itemId: field.name
			};
		}
	},

	createFormInputString: function (field, model)
	{
		return {
			xtype: "textfield",
			name:  field.name,
			fieldLabel: field.name,
			itemId: field.name
		};
	},

	setModel: function (model)
	{
		this.loadRecord(model);

		model.on("remote-set", this.loadRecord, this);
	}
});